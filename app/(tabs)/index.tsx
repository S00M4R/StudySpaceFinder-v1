import { useRouter } from 'expo-router';
import { HomeScreen } from '../../src/screens/HomeScreen';

export default function Home() {
  const router = useRouter();
  return <HomeScreen navigation={{ navigate: (screen: string, params?: any) => {
    if (screen === 'SpaceDetail') router.push(`/space/${params.spaceId}`);
    if (screen === 'Profile') router.push('/profile');
  }}} />;
}