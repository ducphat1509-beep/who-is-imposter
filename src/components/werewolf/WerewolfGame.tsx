import { useState } from "react";
import Image from "next/image";
import { Check, Moon, Skull, Sun, Users, Vote } from "lucide-react";
import clsx from "clsx";
import { GameTeam, Player, Room, WerewolfNightActionType } from "@/types/game";
import {
  playAgain,
  revealCard,
  resolveWerewolfNightPhase,
  startWerewolfNight,
  startWerewolfVoting,
  submitWerewolfNightAction,
  submitWerewolfVote,
} from "@/lib/roomActions";
import {
  canVote,
  getRequiredNightActors,
  getWerewolfNightActionType,
  isAlive,
} from "@/lib/games/werewolf/logic";
import { getWerewolfRole } from "@/lib/games/werewolf/roles";
import Lobby from "@/components/Lobby";

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
  return "Bỏ qua lượt";
}

function getWinnerLabel(winner: GameTeam | null | undefined): string {
  if (winner === "VILLAGE") return "Phe Dân thắng";
  if (winner === "WEREWOLF") return "Phe Sói thắng";
  if (winner === "SOLO") return "Phe Solo thắng";
  return "Ván đấu kết thúc";
}

export default function WerewolfGame({ room, currentPlayer, isHost, currentPlayerId }: Props) {
  const [showRole, setShowRole] = useState(false);
  const [selectedVoteId, setSelectedVoteId] = useState<string | null>(null);

  if (room.status === "WAITING") {
    return <Lobby room={room} isHost={isHost} currentPlayerId={currentPlayerId} />;
  }

  if (!currentPlayer) return null;

  const phase = room.werewolfPhase ?? "ROLE_REVEAL";
  const role = getWerewolfRole(currentPlayer.roleId);
  const allRevealed = room.players.every((player) => player.hasRevealed);
  const alivePlayers = room.players.filter(isAlive);
  const requiredActors = getRequiredNightActors(room.players);
  const completedNightActions = requiredActors.filter((player) => room.werewolfNightActions?.[player.id]);
  const currentNightActionType = getWerewolfNightActionType(currentPlayer);
  const currentNightAction = room.werewolfNightActions?.[currentPlayer.id];
  const currentPlayerCanVote = canVote(currentPlayer);
  const currentPlayerVoted = !!currentPlayer.vote;

  const handleReveal = async () => {
    setShowRole(true);
    if (!currentPlayer.hasRevealed) {
      await revealCard(room.id, currentPlayer.id);
    }
  };

  const handleNightAction = async (targetId: string | null) => {
    await submitWerewolfNightAction(room.id, currentPlayer.id, targetId);
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

        <PlayerStateList players={room.players} />

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
          subtitle={allRevealed ? "Mọi người đã xem vai. Chủ phòng có thể bắt đầu đêm đầu tiên." : "Chạm vào lá bài để xem vai trò bí mật của bạn."}
        />

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

        {isHost && (
          <button
            onClick={() => startWerewolfNight(room.id)}
            disabled={!allRevealed}
            className="btn-danger w-full py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Bắt đầu đêm
          </button>
        )}
      </div>
    );
  }

  if (phase === "NIGHT_ACTION") {
    return (
      <div className="flex flex-col gap-6 w-full h-full pb-8">
        <Header
          icon={<Moon className="w-8 h-8" />}
          title={`Đêm ${room.round ?? 1}`}
          subtitle="Quản trò gọi các vai có chức năng. Người không có lượt thì ngủ ngoan."
        />

        <SummaryPanel lines={room.werewolfSummary ?? []} />

        <div className="glass-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Lượt hành động</h3>
            <span className="text-xs rounded-full bg-primary/20 text-primary px-3 py-1 font-bold">
              {completedNightActions.length}/{requiredActors.length}
            </span>
          </div>

          {currentNightActionType && isAlive(currentPlayer) ? (
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
                  players={alivePlayers}
                  currentPlayerId={currentPlayerId}
                  allowSelf={currentNightActionType === "GUARD_PROTECT"}
                  onPick={handleNightAction}
                />
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Bạn không có hành động trong đêm này.</p>
          )}
        </div>

        {isHost && (
          <button onClick={() => resolveWerewolfNightPhase(room.id)} className="btn-primary w-full py-4">
            Công bố trời sáng
          </button>
        )}
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
        <SummaryPanel lines={room.werewolfSummary ?? []} />
        <PlayerStateList players={room.players} />
        {isHost && (
          <button onClick={() => startWerewolfVoting(room.id)} className="btn-danger w-full py-4">
            Bắt đầu vote treo cổ
          </button>
        )}
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
        <div className="glass-card space-y-3">
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
      <SummaryPanel lines={room.werewolfSummary ?? []} />
      <PlayerStateList players={room.players} />
      {isHost && (
        <button onClick={() => startWerewolfNight(room.id)} className="btn-primary w-full py-4">
          Sang đêm tiếp theo
        </button>
      )}
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

function PlayerStateList({ players }: { players: Player[] }) {
  return (
    <div className="glass-card space-y-2">
      {players.map((player) => {
        const role = getWerewolfRole(player.roleId);
        return (
          <div key={player.id} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
            <div>
              <p className="text-sm font-medium">{player.name}</p>
              <p className="text-xs text-slate-500">{role.name}</p>
            </div>
            <span
              className={clsx(
                "text-xs rounded-full px-2 py-1",
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

function TargetPicker({
  players,
  currentPlayerId,
  allowSelf,
  onPick,
}: {
  players: Player[];
  currentPlayerId: string;
  allowSelf: boolean;
  onPick: (targetId: string) => void;
}) {
  return (
    <div className="space-y-2">
      {players
        .filter((player) => allowSelf || player.id !== currentPlayerId)
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
