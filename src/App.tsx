import { useState } from 'react';
import { COURSE, selectCourse } from './data/course';
import { useRound } from './hooks/useRound';
import { useSticky } from './hooks/useSticky';
import FinishScreen from './screens/FinishScreen';
import HoleScreen from './screens/HoleScreen';
import PlatzbelegungScreen from './screens/PlatzbelegungScreen';
import PlatzstatusScreen from './screens/PlatzstatusScreen';
import ScorecardSheet from './screens/ScorecardSheet';
import SetupScreen from './screens/SetupScreen';
import TurnScreen from './screens/TurnScreen';
import type { AppTab } from './components/TopMenu';

export default function App() {
  const [round, dispatch] = useRound();
  const [cardOpen, setCardOpen] = useState(false);
  const [tab, setTab] = useState<AppTab>('scorecard');
  // Zuletzt gewählter Club für die nächste Runde; eine laufende Runde bleibt
  // auf ihrem Platz.
  const [courseId, setCourseId] = useSticky('scorekarte.courseId', 'velbert');
  selectCourse(round ? round.courseId : courseId);

  if (!round) {
    if (tab === 'status' && COURSE.platzinfo) {
      return <PlatzstatusScreen active={tab} onNavigate={setTab} />;
    }
    if (tab === 'belegung' && COURSE.platzinfo) {
      return <PlatzbelegungScreen active={tab} onNavigate={setTab} />;
    }
    return (
      <SetupScreen
        active={tab}
        onNavigate={setTab}
        courseId={COURSE.id}
        onCourseChange={setCourseId}
        onStart={(players, mode, layout, allowance) =>
          dispatch({ type: 'start', courseId: COURSE.id, players, mode, layout, allowance })
        }
      />
    );
  }

  const openCard = () => setCardOpen(true);

  return (
    <>
      {round.stage === 'hole' && (
        <HoleScreen round={round} dispatch={dispatch} onOpenCard={openCard} />
      )}
      {round.stage === 'turn' && (
        <TurnScreen round={round} dispatch={dispatch} onOpenCard={openCard} />
      )}
      {round.stage === 'finish' && (
        <FinishScreen round={round} dispatch={dispatch} onOpenCard={openCard} />
      )}

      {cardOpen && (
        <ScorecardSheet
          round={round}
          dispatch={dispatch}
          onClose={() => setCardOpen(false)}
        />
      )}
    </>
  );
}
