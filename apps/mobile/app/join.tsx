// SPDX-License-Identifier: AGPL-3.0-only
import { Redirect, useLocalSearchParams } from 'expo-router';
export default function Join() {
  const { token } = useLocalSearchParams<{ token: string }>();
  return (
    <Redirect href={{ pathname: '/', params: { token: typeof token === 'string' ? token : '' } }} />
  );
}
