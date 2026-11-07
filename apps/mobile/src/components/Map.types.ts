// SPDX-License-Identifier: AGPL-3.0-only
import type { Coordinate, Participant, Place, Route } from '../../../../packages/shared/src/index';
export interface MapProps {
  destination?: Place;
  meetingPoint?: Place | null;
  origin?: Coordinate;
  participants?: Participant[];
  route?: Route | null;
  onSelect?: (point: Coordinate) => void;
  height?: number;
}
