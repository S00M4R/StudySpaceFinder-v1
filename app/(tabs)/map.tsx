import { useRouter } from 'expo-router';
import { BuildingMapScreen } from '../../src/screens/BuildingMapScreen';

export default function MapTab() {
  const router = useRouter();
  return (
    <BuildingMapScreen
      navigation={{
        navigate: (screen: string, params: any) => {
          if (screen === 'SpaceDetail') {
            router.push({ pathname: '/space/[id]', params: { id: params.spaceId } });
          }
        },
      }}
    />
  );
}
