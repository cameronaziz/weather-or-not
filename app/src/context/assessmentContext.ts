import { createContext } from 'react';
import type { AssessmentContextValue } from '../types';

const assessmentContext = createContext<AssessmentContextValue>({
  locationName: '',
  recommendation: '',
  set: () => {
    // Do Nothing
  },
  reset: () => {
    // Do Nothing
  },
});

export default assessmentContext;
