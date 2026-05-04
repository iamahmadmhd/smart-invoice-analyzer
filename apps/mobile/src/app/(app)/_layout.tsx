import { Icon } from '@/components/atoms/icon';
import { Text } from '@/components/atoms/text';
import { colors } from '@/constants/theme';
import { useAppDispatch, useAppSelector } from '@/store';
import { signOutThunk } from '@/store/slices/auth-slice';
import { Redirect, Tabs } from 'expo-router';
import { Pressable, useColorScheme } from 'react-native';
import { useResolveClassNames } from 'uniwind';

export default function AppLayout() {
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);
    const scheme = useColorScheme();

    const dark = scheme === 'dark';
    const classNames = useResolveClassNames(
        dark
            ? 'bg-night border-wire-night text-cloud-faint'
            : 'bg-canvas-subtle border-wire text-ink-faint'
    );

    if (!user) {
        return <Redirect href='/(auth)/sign-in' />;
    }

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                sceneStyle: classNames,
                tabBarStyle: {
                    ...classNames,
                    borderTopWidth: 1,
                    height: 80,
                    paddingBottom: 20,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: colors.brand,
                tabBarInactiveTintColor: classNames.color as string,
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
                    headerShown: true,
                    headerStyle: { backgroundColor: classNames.backgroundColor as string },
                    headerShadowVisible: false,
                    headerTitle: () => (
                        <Text
                            variant='heading2'
                            color='primary'
                        >
                            Smart Invoice
                        </Text>
                    ),
                    headerRight: () => (
                        <Pressable
                            onPress={() => dispatch(signOutThunk())}
                            className='mr-4'
                            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                        >
                            <Icon
                                name='logout'
                                size={20}
                                color='secondary'
                            />
                        </Pressable>
                    ),
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
                    headerShown: false,
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
