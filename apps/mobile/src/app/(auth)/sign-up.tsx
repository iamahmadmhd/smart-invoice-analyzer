import { Text } from '@/components';
import { View } from 'react-native';

export default function SignupScreen() {
    return (
        <View className='flex-1 items-center justify-center bg-canvas-subtle dark:bg-night'>
            <Text className='text-lg text-ink dark:text-cloud'>Create a new account</Text>
        </View>
    );
}
