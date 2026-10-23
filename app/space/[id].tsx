import { useLocalSearchParams, useRouter } from 'expo-router';
import { SpaceDetailScreen } from '../../src/screens/SpaceDetailScreen';

export default function SpaceDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  return <SpaceDetailScreen
    navigation={{ goBack: () => router.back() }}
    route={{ params: { spaceId: id as string } }}
  />;
}