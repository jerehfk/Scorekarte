import { useEffect, useReducer } from 'react';
import { holeRange } from '../data/course';
import { loadRound, saveRound } from '../lib/storage';
import type { Allowance, Player, Round, RoundLayout, ScoreMode } from '../types';

type State = Round | null;

export type Action =
  | {
      type: 'start';
      courseId: string;
      players: Player[];
      mode: ScoreMode;
      layout: RoundLayout;
      allowance: Allowance;
    }
  | { type: 'setScore'; playerId: string; holeNr: number; value: number | null }
  | { type: 'setMode'; mode: ScoreMode }
  | { type: 'goHole'; nr: number }
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'finish' }
  | { type: 'reset' };

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `r${Date.now()}`;
}

function reducer(state: State, action: Action): State {
  if (action.type === 'reset') return null;

  if (action.type === 'start') {
    const scores: Round['scores'] = {};
    for (const p of action.players) scores[p.id] = Array<number | null>(18).fill(null);
    return {
      id: newId(),
      startedAt: new Date().toISOString(),
      courseId: action.courseId,
      mode: action.mode,
      layout: action.layout,
      allowance: action.allowance,
      players: action.players,
      scores,
      currentHole: holeRange(action.layout).from,
      stage: 'hole',
    };
  }

  if (!state) return state;

  switch (action.type) {
    case 'setScore': {
      const next = [...(state.scores[action.playerId] ?? Array(18).fill(null))];
      next[action.holeNr - 1] = action.value;
      return { ...state, scores: { ...state.scores, [action.playerId]: next } };
    }

    case 'setMode':
      return { ...state, mode: action.mode };

    case 'goHole': {
      const { from, to } = holeRange(state.layout);
      return {
        ...state,
        stage: 'hole',
        currentHole: Math.min(to, Math.max(from, action.nr)),
      };
    }

    case 'next': {
      const { to } = holeRange(state.layout);
      // Der Zwischenstand schiebt sich nur in eine volle Runde dazwischen.
      if (state.stage === 'turn') return { ...state, stage: 'hole', currentHole: 10 };
      if (state.stage === 'finish') return state;
      if (state.layout === 'full' && state.currentHole === 9) {
        return { ...state, stage: 'turn' };
      }
      if (state.currentHole >= to) return { ...state, stage: 'finish' };
      return { ...state, currentHole: state.currentHole + 1 };
    }

    case 'prev': {
      const { from, to } = holeRange(state.layout);
      if (state.stage === 'finish') return { ...state, stage: 'hole', currentHole: to };
      if (state.stage === 'turn') return { ...state, stage: 'hole', currentHole: 9 };
      if (state.layout === 'full' && state.currentHole === 10) {
        return { ...state, stage: 'turn' };
      }
      if (state.currentHole <= from) return state;
      return { ...state, currentHole: state.currentHole - 1 };
    }

    case 'finish':
      return { ...state, stage: 'finish' };
  }
}

export function useRound() {
  // Laufende Runde wird beim Start direkt wiederhergestellt – Handy zwischendurch
  // zugeklappt heisst nicht, dass die Karte weg ist.
  const [round, dispatch] = useReducer(reducer, null, loadRound);

  useEffect(() => {
    saveRound(round);
  }, [round]);

  return [round, dispatch] as const;
}
