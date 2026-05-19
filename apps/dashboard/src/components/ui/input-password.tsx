import { IconEye, IconEyeOff } from '@tabler/icons-react';
import { useState } from 'react';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from './input-group';

type InputPasswordProps = Omit<React.ComponentProps<'input'>, 'type'>;

function InputPassword({ className, ...props }: InputPasswordProps) {
    const [isVisible, setIsVisible] = useState(false);
    return (
        <InputGroup>
            <InputGroupInput
                type={isVisible ? 'text' : 'password'}
                {...props}
            />
            <InputGroupAddon align='inline-end'>
                <InputGroupButton
                    size='icon-sm'
                    onClick={() => setIsVisible(!isVisible)}
                >
                    {isVisible ? <IconEyeOff /> : <IconEye />}
                </InputGroupButton>
            </InputGroupAddon>
        </InputGroup>
    );
}

export { InputPassword };
