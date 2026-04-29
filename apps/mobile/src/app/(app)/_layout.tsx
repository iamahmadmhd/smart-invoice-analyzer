import { useAppSelector } from '@/store';
import { Redirect, Tabs } from 'expo-router';
import { Icon } from '@/components/atoms/icon';
import { colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { useResolveClassNames } from 'uniwind';

export default function AppLayout() {
    const user = useAppSelector((state) => state.auth.user);
    const scheme = useColorScheme();

    const dark = scheme === 'dark';
    const backgroundColor = useResolveClassNames(dark ? 'bg-night' : 'bg-canvas-subtle');
    const tabBarBorder = useResolveClassNames(dark ? 'border-wire-night' : 'border-wire');
    const inactiveTintColor = useResolveClassNames(dark ? 'text-cloud-faint' : 'text-ink-faint');

    if (!user) {
        return <Redirect href='/(auth)/sign-in' />;
    }

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                sceneStyle: backgroundColor,
                tabBarStyle: {
                    ...backgroundColor,
                    ...tabBarBorder,
                    borderTopWidth: 1,
                    height: 80,
                    paddingBottom: 20,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: colors.brand,
                tabBarInactiveTintColor: inactiveTintColor.color as string,
                tabBarLabelStyle: {
                    fontFamily: 'PlusJakartaSans_500Medium',
                    fontSize: 11,
                    marginTop: 2,
                },
            }}
        >
            <Tabs.Screen
                name='index'
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <Icon
                            name='home'
                            size={size ?? 22}
                            tintColor={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name='invoices'
                options={{
                    title: 'Invoices',
                    tabBarIcon: ({ color, size }) => (
                        <Icon
                            name='invoices'
                            size={size ?? 22}
                            tintColor={color}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}
