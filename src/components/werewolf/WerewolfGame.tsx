import { useEffect, useState } from "react";
import Image from "next/image";
import { Check, Moon, Skull, Sun, Users, Vote } from "lucide-react";
import clsx from "clsx";
import { GameTeam, Player, Room, WerewolfEventState, WerewolfNightActionType, WerewolfNightCall } from "@/types/game";
import {
  advanceWerewolfNightCallIfReady,
  playAgain,
  revealCard,
  startWerewolfNight,
  startWerewolfVoting,
  submitWerewolfNightAction,
  submitWerewolfVote,
} from "@/lib/roomActions";
import {
  canVote,
  getSelectedWolfTarget,
  getNightActionKey,
  getWerewolfNightCalls,
  isAlive,
  WEREWOLF_SKIP_VOTE,
} from "@/lib/games/werewolf/logic";
import { getWerewolfRole } from "@/lib/games/werewolf/roles";
import Lobby from "@/components/Lobby";
import WerewolfNarrator from "@/components/werewolf/WerewolfNarrator";

interface Props {
  room: Room;
  currentPlayer: Player | undefined;
  isHost: boolean;
  currentPlayerId: string;
}

function getActionTitle(actionType: WerewolfNightActionType): string {
  if (actionType === "WOLF_KILL") return "Chọn người để cắn";
  if (actionType === "GUARD_PROTECT") return "Chọn người để bảo vệ";
  if (actionType === "SEER_CHECK") return "Chọn người để soi";
  if (actionType === "ICE_WOLF_FREEZE") return "Chọn người để đóng băng";
  if (actionType === "FIRE_WOLF_CURSE") return "Chọn người để gieo lời nguyền";
  if (actionType === "CONVERTER_WOLF_CONVERT") return "Chọn người để hóa Sói";
  if (actionType === "CAPTAIN_GUARD_SHOOT") return "Chọn người để ra tay";
  if (actionType === "WHITE_WOLF_KILL") return "Chọn một Sói để loại";
  return "Bỏ qua lượt";
}

function getWinnerLabel(winner: GameTeam | null | undefined): string {
  if (winner === "VILLAGE") return "Phe Dân thắng";
  if (winner === "WEREWOLF") return "Phe Sói thắng";
  if (winner === "SOLO") return "Phe Solo thắng";
  return "Ván đấu kết thúc";
}

function getCallProgress(call: WerewolfNightCall | undefined, room: Room): string {
  if (!call) return "0/0";
  if (!call.requiresAction) return "Ghi chú";

  const done = call.actorIds.filter((actorId) => {
    return !!room.werewolfNightActions?.[getNightActionKey(call.id, actorId)];
  }).length;

  return `${done}/${call.actorIds.length}`;
}

function getNightTargetPlayers(
  players: Player[],
  actionType: WerewolfNightActionType | null,
  currentPlayerId: string
): Player[] {
  if (!actionType) return players;

  if (actionType === "WOLF_KILL") {
    return players.filter((player) => player.team !== "WEREWOLF");
  }

  if (actionType === "WHITE_WOLF_KILL") {
    return players.filter((player) => player.team === "WEREWOLF");
  }

  if (actionType === "CONVERTER_WOLF_CONVERT") {
    return players.filter((player) => player.team !== "WEREWOLF");
  }

  if (actionType === "WITCH_POISON") {
    return players.filter((player) => player.id !== currentPlayerId);
  }

  return players;
}

export default function WerewolfGame({ room, currentPlayer, isHost, currentPlayerId }: Props) {
  if (room.status === "WAITING") {
    return <Lobby room={room} isHost={isHost} currentPlayerId={currentPlayerId} />;
  }

  if (!currentPlayer) return null;

  return (
    <WerewolfGameContent
      room={room}
      currentPlayer={currentPlayer}
      isHost={isHost}
      currentPlayerId={currentPlayerId}
    />
  );
}

function WerewolfGameContent({ room, currentPlayer, isHost, currentPlayerId }: Props & { currentPlayer: Player }) {
  const [revealedRoleKeys, setRevealedRoleKeys] = useState<Record<string, boolean>>({});
  const [selectedVoteId, setSelectedVoteId] = useState<string | null>(null);
  const [isChoosingPoison, setIsChoosingPoison] = useState(false);

  const phase = room.werewolfPhase ?? "ROLE_REVEAL";
  const role = getWerewolfRole(currentPlayer.roleId);
  const revealKey = `${room.id}:${room.round ?? 0}:${currentPlayer.roleId ?? "none"}`;
  const showRole = revealedRoleKeys[revealKey] ?? false;
  const allRevealed = room.players.every((player) => player.hasRevealed);
  const alivePlayers = room.players.filter(isAlive);
  const nightCalls = getWerewolfNightCalls(room.players, room.round ?? 1);
  const currentCallIndex = room.werewolfNightCallIndex ?? 0;
  const currentNightCall = nightCalls[currentCallIndex];
  const isCurrentNightActor = !!currentNightCall?.actorIds.includes(currentPlayerId);
  const currentNightActionType = isCurrentNightActor ? currentNightCall.actionType : null;
  const currentNightAction = currentNightCall
    ? room.werewolfNightActions?.[getNightActionKey(currentNightCall.id, currentPlayer.id)]
    : undefined;
  const currentPlayerCanVote = canVote(currentPlayer);
  const currentPlayerVoted = !!currentPlayer.vote;
  const eligibleNightTargets = getNightTargetPlayers(alivePlayers, currentNightActionType, currentPlayerId);
  const wolfTargetId = getSelectedWolfTarget(room.werewolfNightActions ?? {});
  const wolfTargetPlayer = room.players.find((player) => player.id === wolfTargetId);
  const witchCanSave = !currentPlayer.statusEffects?.includes("witch_save_used") && !!wolfTargetId;
  const witchCanPoison = !currentPlayer.statusEffects?.includes("witch_poison_used");
  const narrator = <WerewolfNarrator room={room} currentNightCall={currentNightCall} />;
  const currentCallProgressKey = currentNightCall
    ? currentNightCall.actorIds
        .map((actorId) => `${actorId}:${room.werewolfNightActions?.[getNightActionKey(currentNightCall.id, actorId)]?.createdAt ?? 0}`)
        .join("|")
    : "none";

  useEffect(() => {
    if (phase !== "ROLE_REVEAL" || !allRevealed) return;

    const timeout = setTimeout(() => {
      startWerewolfNight(room.id).catch(console.error);
    }, 4500);

    return () => clearTimeout(timeout);
  }, [allRevealed, phase, room.id]);

  useEffect(() => {
    if (phase !== "NIGHT_ACTION" || !currentNightCall) return;

    const timeout = setTimeout(() => {
      advanceWerewolfNightCallIfReady(room.id).catch(console.error);
    }, currentNightCall.requiresAction ? 900 : 2500);

    return () => clearTimeout(timeout);
  }, [currentCallIndex, currentCallProgressKey, currentNightCall, phase, room.id]);

  useEffect(() => {
    if (phase !== "DAY_ANNOUNCEMENT") return;

    const timeout = setTimeout(() => {
      startWerewolfVoting(room.id).catch(console.error);
    }, room.werewolfActiveEvent?.card.effect === "EXTRA_DISCUSSION" ? 20000 : 12000);

    return () => clearTimeout(timeout);
  }, [phase, room.id, room.werewolfActiveEvent?.card.effect]);

  useEffect(() => {
    if (phase !== "EXECUTION") return;

    const timeout = setTimeout(() => {
      startWerewolfNight(room.id).catch(console.error);
    }, 5500);

    return () => clearTimeout(timeout);
  }, [phase, room.id]);

  const handleReveal = async () => {
    setRevealedRoleKeys((current) => ({ ...current, [revealKey]: true }));
    if (!currentPlayer.hasRevealed) {
      await revealCard(room.id, currentPlayer.id);
    }
  };

  const handleNightAction = async (targetId: string | null, actionType?: WerewolfNightActionType) => {
    await submitWerewolfNightAction(room.id, currentPlayer.id, targetId, actionType);
  };

  const handleVote = async () => {
    if (!selectedVoteId || currentPlayerVoted || !currentPlayerCanVote) return;
    await submitWerewolfVote(room.id, currentPlayerId, selectedVoteId);
    setSelectedVoteId(null);
  };

  const selectedSeerTarget = currentNightAction?.type === "SEER_CHECK"
    ? room.players.find((player) => player.id === currentNightAction.targetId)
    : null;

  if (room.status === "RESULT") {
    return (
      <div className="flex flex-col gap-6 w-full h-full pb-8">
        <div className="text-center space-y-3 pt-6">
          <Skull className="w-20 h-20 text-danger mx-auto drop-shadow-lg" />
          <h2 className="text-3xl font-black text-white">{getWinnerLabel(room.werewolfWinner)}</h2>
          <div className="space-y-2 text-slate-300">
            {(room.werewolfSummary ?? []).map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>

        {narrator}

        <PlayerStateList players={room.players} revealRoles />

        {isHost && (
          <button onClick={() => playAgain(room.id)} className="btn-primary w-full py-4">
            Chơi ván mới
          </button>
        )}
      </div>
    );
  }

  if (phase === "ROLE_REVEAL") {
    return (
      <div className="flex flex-col gap-6 w-full h-full pb-8">
        <Header
          icon={<Moon className="w-8 h-8" />}
          title="Ma Sói"
          subtitle={allRevealed ? "Mọi người đã xem vai. Quản trò tự động chuẩn bị gọi đêm đầu tiên." : "Chạm vào lá bài để xem vai trò bí mật của bạn."}
        />
        {narrator}

        <div
          className="relative mx-auto w-72 max-w-full aspect-[3/4] cursor-pointer group perspective-1000"
          onClick={handleReveal}
        >
          <div
            className={clsx(
              "w-full h-full transition-all duration-700 preserve-3d relative",
              showRole ? "rotate-y-180" : "hover:scale-105"
            )}
          >
            <div className="absolute inset-0 backface-hidden">
              <div className="w-full h-full rounded-xl border-4 border-slate-700 bg-surface shadow-2xl flex items-center justify-center">
                <span className="text-slate-400 font-medium">Chạm để lật</span>
              </div>
            </div>

            <div className="absolute inset-0 backface-hidden rotate-y-180">
              <RoleImageFrame image={role.cardImage} name={role.name} />
            </div>
          </div>
        </div>

        {showRole && (
          <div className="glass-card space-y-2 border-danger/20 bg-danger/5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-bold text-white">{role.name}</h3>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-200">
                {role.factionLabel}
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{role.cardText}</p>
            <p className="text-xs text-slate-500 leading-relaxed">{role.description}</p>
          </div>
        )}

        <div className="glass-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-danger" />
              Trạng thái xem vai
            </h3>
            <span className="text-xs rounded-full bg-danger/20 text-danger px-3 py-1 font-bold">
              Round {room.round ?? 1}
            </span>
          </div>
          <PlayerRevealList players={room.players} />
        </div>
        {allRevealed && (
          <div className="glass-card py-4 text-center border-primary/30 bg-primary/5">
            <p className="text-primary font-medium animate-pulse">Quản trò đang chuyển sang đêm...</p>
          </div>
        )}
      </div>
    );
  }

  if (phase === "NIGHT_ACTION") {
    const aliveWolfNames = room.players
      .filter((player) => isAlive(player) && player.team === "WEREWOLF")
      .map((player) => player.name)
      .join(", ");

    return (
      <div className="flex flex-col gap-6 w-full h-full pb-8">
        <Header
          icon={<Moon className="w-8 h-8" />}
          title={`Đêm ${room.round ?? 1}`}
          subtitle={currentNightCall ? `Quản trò gọi: ${currentNightCall.title}` : "Không còn vai cần gọi."}
        />
        {narrator}

        <SummaryPanel lines={room.werewolfSummary ?? []} />

        <div className="glass-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{currentNightCall?.title ?? "Hết lượt gọi"}</h3>
            <span className="text-xs rounded-full bg-primary/20 text-primary px-3 py-1 font-bold">
              {currentCallIndex + 1}/{Math.max(nightCalls.length, 1)} · {getCallProgress(currentNightCall, room)}
            </span>
          </div>

          <p className="text-sm text-slate-300">{currentNightCall?.instruction ?? "Host có thể công bố trời sáng."}</p>

          {currentNightCall?.id === "wolf-pack" && currentPlayer.team === "WEREWOLF" && (
            <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-slate-200">
              Đồng bọn còn sống: <b>{aliveWolfNames}</b>
            </div>
          )}

          {currentNightCall?.id === "witch" && isCurrentNightActor && isAlive(currentPlayer) ? (
            <div className="space-y-3">
              {currentNightAction ? (
                <div className="rounded-xl border border-success/30 bg-success/10 p-3 text-success text-sm">
                  Đã chốt hành động.
                </div>
              ) : (
                <>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-slate-300">
                    Nạn nhân Sói đang chọn: <b>{wolfTargetPlayer?.name ?? "chưa có / không ai"}</b>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => wolfTargetId && handleNightAction(wolfTargetId, "WITCH_SAVE")}
                      disabled={!witchCanSave}
                      className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Dùng bình cứu
                    </button>
                    <button
                      onClick={() => setIsChoosingPoison((current) => !current)}
                      disabled={!witchCanPoison}
                      className="btn-danger w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Dùng bình độc
                    </button>
                    <button
                      onClick={() => handleNightAction(null)}
                      className="btn-secondary w-full"
                    >
                      Không làm gì
                    </button>
                  </div>
                  {isChoosingPoison && (
                    <TargetPicker
                      players={getNightTargetPlayers(alivePlayers, "WITCH_POISON", currentPlayerId)}
                      currentPlayerId={currentPlayerId}
                      allowSelf={false}
                      onPick={(targetId) => handleNightAction(targetId, "WITCH_POISON")}
                      onSkip={() => handleNightAction(null)}
                    />
                  )}
                </>
              )}
            </div>
          ) : currentNightActionType && isAlive(currentPlayer) ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-300">{getActionTitle(currentNightActionType)}</p>
              {currentNightAction ? (
                <div className="rounded-xl border border-success/30 bg-success/10 p-3 text-success text-sm">
                  Đã chốt hành động.
                  {selectedSeerTarget && (
                    <div className="mt-2 text-slate-200">
                      Kết quả soi: <b>{selectedSeerTarget.name}</b>{" "}
                      {selectedSeerTarget.team === "WEREWOLF" ? "có mùi Sói." : "không phải phe Sói."}
                    </div>
                  )}
                </div>
              ) : (
                <TargetPicker
                  players={eligibleNightTargets}
                  currentPlayerId={currentPlayerId}
                  allowSelf={currentNightCall?.allowSelfTarget ?? false}
                  unavailableTargetId={currentNightCall?.id === "guard" ? currentPlayer.guardLastTargetId ?? null : null}
                  onPick={handleNightAction}
                  onSkip={() => handleNightAction(null)}
                />
              )}
            </div>
          ) : currentNightCall?.actorIds.includes(currentPlayerId) ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
              Vai này đang được gọi, nhưng chức năng hiện để quản trò ghi chú thủ công.
            </div>
          ) : (
            <p className="text-sm text-slate-400">Bạn đang ngủ. Đợi quản trò gọi đúng vai.</p>
          )}
        </div>
        <div className="glass-card py-4 text-center border-primary/30 bg-primary/5">
          <p className="text-primary font-medium animate-pulse">Quản trò sẽ tự gọi lượt kế tiếp khi lượt này xong.</p>
        </div>
      </div>
    );
  }

  if (phase === "DAY_ANNOUNCEMENT") {
    return (
      <div className="flex flex-col gap-6 w-full h-full pb-8">
        <Header
          icon={<Sun className="w-8 h-8" />}
          title="Trời sáng"
          subtitle="Quản trò công bố kết quả đêm. Làng bắt đầu nghi ngờ nhau rất văn minh."
        />
        {narrator}
        {room.werewolfActiveEvent && <EventCardView event={room.werewolfActiveEvent} />}
        <SummaryPanel lines={room.werewolfSummary ?? []} />
        <PlayerStateList players={room.players} />
        <div className="glass-card py-4 text-center border-primary/30 bg-primary/5">
          <p className="text-primary font-medium animate-pulse">Quản trò sẽ tự chuyển sang vote sau phần thông báo.</p>
        </div>
      </div>
    );
  }

  if (phase === "TRIAL_VOTING") {
    return (
      <div className="flex flex-col gap-6 w-full h-full pb-8">
        <Header
          icon={<Vote className="w-8 h-8" />}
          title="Bỏ phiếu"
          subtitle={currentPlayerVoted ? "Bạn đã bỏ phiếu. Đợi những người còn lại." : "Chọn một người để treo cổ."}
        />
        {narrator}
        <div className="glass-card space-y-3">
          <button
            onClick={() => !currentPlayerVoted && currentPlayerCanVote && setSelectedVoteId(WEREWOLF_SKIP_VOTE)}
            disabled={currentPlayerVoted || !currentPlayerCanVote}
            className={clsx(
              "w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all",
              selectedVoteId === WEREWOLF_SKIP_VOTE ? "border-primary bg-primary/10" : "border-white/5 bg-white/5 hover:bg-white/10",
              (currentPlayerVoted || !currentPlayerCanVote) && "opacity-70"
            )}
          >
            <span className="font-medium">Bỏ phiếu trắng</span>
            <span className="text-xs text-slate-500">Skip</span>
          </button>
          {alivePlayers.map((player) => {
            const isMe = player.id === currentPlayerId;
            const isSelected = selectedVoteId === player.id;
            return (
              <button
                key={player.id}
                onClick={() => !isMe && !currentPlayerVoted && currentPlayerCanVote && setSelectedVoteId(player.id)}
                disabled={isMe || currentPlayerVoted || !currentPlayerCanVote}
                className={clsx(
                  "w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all",
                  isSelected ? "border-danger bg-danger/10" : "border-white/5 bg-white/5 hover:bg-white/10",
                  (isMe || currentPlayerVoted || !currentPlayerCanVote) && "opacity-70"
                )}
              >
                <span className="font-medium">
                  {player.name}
                  {isMe && <span className="ml-2 text-xs text-primary">Bạn</span>}
                </span>
                {player.vote && <Check className="w-4 h-4 text-success" />}
              </button>
            );
          })}
        </div>

        {!currentPlayerCanVote && (
          <div className="glass-card border-warning/30 bg-yellow-500/5 text-center text-yellow-200">
            Bạn đã mất quyền vote.
          </div>
        )}

        {currentPlayerCanVote && !currentPlayerVoted && (
          <button
            onClick={handleVote}
            disabled={!selectedVoteId}
            className="btn-danger w-full py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Chốt phiếu
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full h-full pb-8">
      <Header
        icon={<Skull className="w-8 h-8" />}
        title="Kết quả treo cổ"
        subtitle="Làng vừa đưa ra một quyết định rất tự tin."
      />
      {narrator}
      <SummaryPanel lines={room.werewolfSummary ?? []} />
      <PlayerStateList players={room.players} />
      <div className="glass-card py-4 text-center border-primary/30 bg-primary/5">
        <p className="text-primary font-medium animate-pulse">Quản trò đang chuyển sang đêm tiếp theo...</p>
      </div>
    </div>
  );
}

function Header({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="text-center space-y-2 pt-4">
      <div className="inline-flex items-center justify-center p-3 bg-danger/20 rounded-2xl mb-2 text-danger">
        {icon}
      </div>
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <p className="text-slate-400">{subtitle}</p>
    </div>
  );
}

function RoleImageFrame({ image, name }: { image: string; name: string }) {
  return (
    <div className="w-full h-full rounded-xl border-4 border-slate-600 bg-black shadow-2xl overflow-hidden p-2">
      <div className="relative w-full h-full rounded-md overflow-hidden bg-black">
        <Image
          src={image}
          alt={`Thẻ vai ${name}`}
          fill
          sizes="288px"
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
}

function SummaryPanel({ lines }: { lines: string[] }) {
  return (
    <div className="glass-card space-y-2">
      {lines.length === 0 ? (
        <p className="text-sm text-slate-400">Chưa có thông báo.</p>
      ) : (
        lines.map((line) => (
          <p key={line} className="text-sm text-slate-300 leading-relaxed">
            {line}
          </p>
        ))
      )}
    </div>
  );
}

function EventCardView({ event }: { event: WerewolfEventState }) {
  return (
    <div className="glass-card relative overflow-hidden border-accent/30 bg-cyan-500/5">
      <div className="absolute right-0 top-0 h-16 w-16 rounded-bl-full bg-accent/10" />
      <p className="text-xs font-bold uppercase tracking-wider text-accent">Thẻ sự kiện</p>
      <h3 className="mt-1 text-xl font-black text-white">{event.card.title}</h3>
      <p className="mt-2 text-sm italic text-slate-300">{event.card.flavor}</p>
      <p className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-cyan-100">
        {event.card.summary}
      </p>
    </div>
  );
}

function PlayerRevealList({ players }: { players: Player[] }) {
  return (
    <div className="space-y-2">
      {players.map((player) => (
        <div key={player.id} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
          <span className="text-sm font-medium">{player.name}</span>
          <span
            className={clsx(
              "text-xs rounded-full px-2 py-1",
              player.hasRevealed ? "bg-success/20 text-success" : "bg-slate-700 text-slate-300"
            )}
          >
            {player.hasRevealed ? "Đã xem vai" : "Chưa xem"}
          </span>
        </div>
      ))}
    </div>
  );
}

function PlayerStateList({ players, revealRoles = false }: { players: Player[]; revealRoles?: boolean }) {
  return (
    <div className="glass-card space-y-2">
      {players.map((player) => {
        const role = getWerewolfRole(player.roleId);
        const statusLabels = getStatusLabels(player);
        return (
          <div key={player.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2">
            <div className="min-w-0">
              <p className="text-sm font-medium">{player.name}</p>
              {revealRoles && <p className="text-xs text-slate-500">{role.name}</p>}
              {statusLabels.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {statusLabels.map((label) => (
                    <span key={label} className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <span
              className={clsx(
                "shrink-0 text-xs rounded-full px-2 py-1",
                isAlive(player) ? "bg-success/20 text-success" : "bg-danger/20 text-danger"
              )}
            >
              {isAlive(player) ? "Sống" : "Chết"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function getStatusLabels(player: Player): string[] {
  const effects = player.statusEffects ?? [];
  const labels: string[] = [];

  if (effects.includes("frozen_vote")) labels.push("Mất vote");
  if (effects.includes("silenced_this_night")) labels.push("Bị khóa đêm");
  if (effects.includes("silenced_next_night")) labels.push("Bị nguyền");
  if (effects.includes("witch_save_used")) labels.push("Hết cứu");
  if (effects.includes("witch_poison_used")) labels.push("Hết độc");
  if (effects.includes("captain_guard_used")) labels.push("Đã ra tay");
  if (effects.includes("converter_wolf_used")) labels.push("Đã hóa Sói");
  if (effects.includes("no_vote")) labels.push("Không vote");

  return labels;
}

function TargetPicker({
  players,
  currentPlayerId,
  allowSelf,
  unavailableTargetId,
  onPick,
  onSkip,
}: {
  players: Player[];
  currentPlayerId: string;
  allowSelf: boolean;
  unavailableTargetId?: string | null;
  onPick: (targetId: string) => void;
  onSkip: () => void;
}) {
  return (
    <div className="space-y-2">
      <button
        onClick={onSkip}
        className="w-full flex items-center justify-between rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-left hover:bg-primary/20 transition-all"
      >
        <span className="font-medium">Không làm gì</span>
        <span className="text-xs text-primary">Skip</span>
      </button>
      {players
        .filter((player) => (allowSelf || player.id !== currentPlayerId) && player.id !== unavailableTargetId)
        .map((player) => (
          <button
            key={player.id}
            onClick={() => onPick(player.id)}
            className="w-full flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-left hover:bg-white/10 transition-all"
          >
            <span className="font-medium">{player.name}</span>
            <span className="text-xs text-slate-500">Chọn</span>
          </button>
        ))}
    </div>
  );
}
