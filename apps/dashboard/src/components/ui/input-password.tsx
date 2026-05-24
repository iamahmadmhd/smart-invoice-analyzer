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
                className={className}
                {...props}
            />
            <InputGroupAddon align='inline-end'>
                <InputGroupButton
                    size='icon-sm'
                    aria-label={isVisible ? 'Hide password' : 'Show password'}
                    onClick={() => setIsVisible((v) => !v)}
                >
                    {isVisible ? (
                        <IconEyeOff className='text-muted-foreground' />
                    ) : (
                        <IconEye className='text-muted-foreground' />
                    )}
                </InputGroupButton>
            </InputGroupAddon>
        </InputGroup>
    );
}

export { InputPassword };
