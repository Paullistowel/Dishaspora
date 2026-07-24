import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { LoadingView } from '@/components/StatusViews';

export default function Index() {
  const { loading, token } = useAuth();
  if (loading) return <LoadingView />;
  // Onboarding is shown right after sign-up (see register + onboarding screens),
  // so the launch gate only decides auth: no token → sign in, else → app.
  if (!token) return <Redirect href="/(auth)/login" />;
  return <Redirect href="/(tabs)" />;
}
