// SPDX-License-Identifier: AGPL-3.0-only
import { createContext, useContext } from 'react';

export const IntroductionContext = createContext<(() => void) | undefined>(undefined);
export const useIntroduction = () => useContext(IntroductionContext);
