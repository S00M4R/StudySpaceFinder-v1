import { useRouter } from 'expo-router';
import { ProfileScreen } from '../../src/screens/ProfileScreen';

export default function Profile() {
  const router = useRouter();
  return <ProfileScreen navigation={{ navigate: (screen: string) => {
    if (screen === 'Survey') router.push('/survey');
  }}} />;
}