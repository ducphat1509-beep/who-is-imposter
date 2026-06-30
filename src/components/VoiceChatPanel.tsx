import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import clsx from "clsx";
import { Player, Room } from "@/types/game";
import { db } from "@/lib/firebase";

interface Props {
  room: Room;
  currentPlayer: Player | undefined;
}

interface VoicePeer {
  id: string;
  name: string;
  muted: boolean;
}

interface PeerConnectionState {
  pc: RTCPeerConnection;
  audio?: HTMLAudioElement;
  unsubscribers: Array<() => void>;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

function getCallId(playerId: string, peerId: string): string {
  return [playerId, peerId].sort().join("_");
}

export default function VoiceChatPanel({ room, currentPlayer }: Props) {
  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [peers, setPeers] = useState<VoicePeer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Record<string, PeerConnectionState>>({});

  const cleanupPeer = (peerId: string) => {
    const state = peerConnectionsRef.current[peerId];
    if (!state) return;

    state.unsubscribers.forEach((unsubscribe) => unsubscribe());
    state.audio?.pause();
    state.audio?.remove();
    state.pc.close();
    delete peerConnectionsRef.current[peerId];
  };

  const leaveVoice = async () => {
    Object.keys(peerConnectionsRef.current).forEach(cleanupPeer);
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setPeers([]);
    setJoined(false);
    setMuted(false);

    if (currentPlayer) {
      await deleteDoc(doc(db, "rooms", room.id, "voicePeers", currentPlayer.id)).catch(console.error);
    }
  };

  const joinVoice = async () => {
    if (!currentPlayer) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      localStreamRef.current = stream;
      await setDoc(doc(db, "rooms", room.id, "voicePeers", currentPlayer.id), {
        name: currentPlayer.name,
        muted: false,
        joinedAt: Date.now(),
      });
      setError(null);
      setJoined(true);
    } catch (err) {
      console.error(err);
      setError("Không mở được micro. Hãy kiểm tra quyền mic của trình duyệt.");
    }
  };

  const toggleMute = async () => {
    if (!currentPlayer || !localStreamRef.current) return;

    const nextMuted = !muted;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    setMuted(nextMuted);
    await setDoc(
      doc(db, "rooms", room.id, "voicePeers", currentPlayer.id),
      { name: currentPlayer.name, muted: nextMuted, joinedAt: Date.now() },
      { merge: true }
    );
  };

  useEffect(() => {
    if (!joined || !currentPlayer || !localStreamRef.current) return;

    const ensurePeerConnection = async (peerId: string) => {
      if (peerConnectionsRef.current[peerId] || !localStreamRef.current) return;

      const callId = getCallId(currentPlayer.id, peerId);
      const isOfferer = currentPlayer.id < peerId;
      const callRef = doc(db, "rooms", room.id, "voiceCalls", callId);
      const pc = new RTCPeerConnection(ICE_SERVERS);
      const unsubscribers: Array<() => void> = [];

      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current as MediaStream);
      });

      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (!remoteStream) return;

        const audio = new Audio();
        audio.srcObject = remoteStream;
        audio.autoplay = true;
        audio.play().catch(() => {
          setError("Trình duyệt đang chặn phát âm thanh tự động. Hãy bấm lại voice sau một tương tác.");
        });
        peerConnectionsRef.current[peerId].audio = audio;
      };

      pc.onicecandidate = (event) => {
        if (!event.candidate) return;
        const candidatePath = isOfferer ? "offerCandidates" : "answerCandidates";
        addDoc(collection(callRef, candidatePath), event.candidate.toJSON()).catch(console.error);
      };

      peerConnectionsRef.current[peerId] = { pc, unsubscribers };

      if (isOfferer) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await setDoc(
          callRef,
          {
            offer: {
              type: offer.type,
              sdp: offer.sdp,
            },
            offererId: currentPlayer.id,
            answererId: peerId,
            updatedAt: Date.now(),
          },
          { merge: true }
        );

        unsubscribers.push(
          onSnapshot(callRef, async (snapshot) => {
            const data = snapshot.data();
            if (!data?.answer || pc.currentRemoteDescription) return;
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer as RTCSessionDescriptionInit));
          })
        );

        unsubscribers.push(
          onSnapshot(collection(callRef, "answerCandidates"), (snapshot) => {
            snapshot.docChanges().forEach((change) => {
              if (change.type !== "added") return;
              pc.addIceCandidate(new RTCIceCandidate(change.doc.data() as RTCIceCandidateInit)).catch(console.error);
            });
          })
        );
      } else {
        unsubscribers.push(
          onSnapshot(callRef, async (snapshot) => {
            const data = snapshot.data();
            if (!data?.offer || pc.currentRemoteDescription) return;

            await pc.setRemoteDescription(new RTCSessionDescription(data.offer as RTCSessionDescriptionInit));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await setDoc(
              callRef,
              {
                answer: {
                  type: answer.type,
                  sdp: answer.sdp,
                },
                updatedAt: Date.now(),
              },
              { merge: true }
            );
          })
        );

        unsubscribers.push(
          onSnapshot(collection(callRef, "offerCandidates"), (snapshot) => {
            snapshot.docChanges().forEach((change) => {
              if (change.type !== "added") return;
              pc.addIceCandidate(new RTCIceCandidate(change.doc.data() as RTCIceCandidateInit)).catch(console.error);
            });
          })
        );
      }
    };

    const unsubscribePeers = onSnapshot(collection(db, "rooms", room.id, "voicePeers"), (snapshot) => {
      const nextPeers = snapshot.docs
        .map((peerDoc) => ({ id: peerDoc.id, ...(peerDoc.data() as Omit<VoicePeer, "id">) }))
        .filter((peer) => peer.id !== currentPlayer.id);

      setPeers(nextPeers);
      nextPeers.forEach((peer) => {
        ensurePeerConnection(peer.id).catch(console.error);
      });

      const activePeerIds = new Set(nextPeers.map((peer) => peer.id));
      Object.keys(peerConnectionsRef.current).forEach((peerId) => {
        if (!activePeerIds.has(peerId)) cleanupPeer(peerId);
      });
    });

    return () => unsubscribePeers();
  }, [currentPlayer, joined, room.id]);

  useEffect(() => {
    return () => {
      const connections = peerConnectionsRef.current;
      Object.values(connections).forEach((state) => {
        state.unsubscribers.forEach((unsubscribe) => unsubscribe());
        state.audio?.pause();
        state.audio?.remove();
        state.pc.close();
      });
      peerConnectionsRef.current = {};
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <section className="glass-card space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-white">
            <Phone className="h-5 w-5 text-accent" />
            Voice chat
          </h3>
          <p className="text-xs text-slate-400">Dùng WebRTC, Firestore chỉ làm tín hiệu kết nối.</p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300">
          {joined ? `${peers.length + 1} online` : "Tắt"}
        </span>
      </div>

      {error && <p className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-red-200">{error}</p>}

      {joined && (
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-bold text-primary">
            Bạn {muted ? "đang tắt mic" : "đang nói"}
          </span>
          {peers.map((peer) => (
            <span key={peer.id} className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-300">
              {peer.name}{peer.muted ? " · mute" : ""}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {joined ? (
          <>
            <button
              type="button"
              onClick={toggleMute}
              className={clsx("btn-secondary flex items-center justify-center gap-2", muted && "border-danger/40 text-danger")}
            >
              {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              {muted ? "Bật mic" : "Tắt mic"}
            </button>
            <button type="button" onClick={leaveVoice} className="btn-danger flex items-center justify-center gap-2">
              <PhoneOff className="h-5 w-5" />
              Rời voice
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={joinVoice}
            disabled={!currentPlayer}
            className="btn-primary col-span-2 flex items-center justify-center gap-2"
          >
            <Mic className="h-5 w-5" />
            Bật voice chat
          </button>
        )}
      </div>
    </section>
  );
}
