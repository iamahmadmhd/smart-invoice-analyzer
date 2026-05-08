import React from 'react';
import { NativeMethods } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import type { SafeAreaViewProps as NativeSafeAreaViewProps } from 'react-native-safe-area-context';
import { NativeProps } from 'react-native-safe-area-context/lib/typescript/src/specs/NativeSafeAreaView';
import { withUniwind } from 'uniwind';

const StyledSafeAreaView = withUniwind(RNSafeAreaView);
type Props = {
    className?: string | undefined;
} & {} & NativeSafeAreaViewProps &
    React.RefAttributes<React.Component<NativeProps, any> & NativeMethods>;

const SafeAreaView = ({ children, ...props }: Props) => {
    return <StyledSafeAreaView {...props}>{children}</StyledSafeAreaView>;
};

export default SafeAreaView;
