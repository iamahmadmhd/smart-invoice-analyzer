import { Text } from '@/components';
import { View } from 'react-native';

export default function ConfirmScreen() {
    return (
        <View className='flex-1 items-center justify-center bg-canvas-subtle dark:bg-night'>
            <Text className='text-lg text-ink dark:text-cloud'>
                Confirmation successful! You can now sign in.
            </Text>
        </View>
    );
}
