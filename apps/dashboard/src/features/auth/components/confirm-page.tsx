import { useForm } from '@tanstack/react-form';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';
import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp';
import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field, FieldError } from '@/components/ui/field';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { Link } from '@/components/ui/link';
import { Loader } from '@/components/ui/loader';

const schema = z.object({
    code: z.string().min(6, 'Enter the 6-digit code').max(6, 'Code must be 6 digits'),
});

export function ConfirmPage() {
    const navigate = useNavigate();
    const { email } = useSearch({ from: '/(auth)/confirm' });
    const [resent, setResent] = useState(false);
    const [error, setError] = useState<{ message: string | undefined } | undefined>(undefined);

    const form = useForm({
        defaultValues: { code: '' },
        validators: { onSubmit: schema },
        onSubmit: async ({ value }) => {
            setError(undefined);
            try {
                await confirmSignUp({ username: email, confirmationCode: value.code });
                navigate({ to: '/signin' });
            } catch (e) {
                if (e instanceof Error) {
                    setError({ message: e.message });
                } else {
                    setError({ message: 'An unknown error occurred.' });
                }
            }
        },
    });

    const handleResend = async () => {
        try {
            await resendSignUpCode({ username: email });
            setResent(true);
            setTimeout(() => setResent(false), 60 * 1000);
        } catch {}
    };

    return (
        <div className='flex flex-col gap-6'>
            <div className='flex flex-col gap-6 glass-card'>
                <div className='flex flex-col gap-2'>
                    <h1 className='text-2xl font-bold'>Verify account</h1>
                    <p className='text-sm text-muted-foreground'>
                        We've sent a verification code to{' '}
                        <span className='font-semibold'>{email}</span>
                    </p>
                </div>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.handleSubmit();
                    }}
                    className='flex flex-col gap-4'
                >
                    {resent && (
                        <p className='rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground'>
                            Code resent — check your inbox.
                        </p>
                    )}

                    <form.Field
                        name='code'
                        children={(field) => (
                            <Field>
                                <Label htmlFor={field.name}>Confirmation code</Label>
                                <InputOTP
                                    id={field.name}
                                    name={field.name}
                                    maxLength={6}
                                    pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                                    containerClassName='gap-4'
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={field.handleChange}
                                    aria-invalid={!field.state.meta.isValid}
                                >
                                    <InputOTPGroup className='grid w-full grid-cols-3 *:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-full *:data-[slot=input-otp-slot]:text-xl'>
                                        <InputOTPSlot index={0} />
                                        <InputOTPSlot index={1} />
                                        <InputOTPSlot index={2} />
                                    </InputOTPGroup>
                                    <InputOTPSeparator />
                                    <InputOTPGroup className='grid w-full grid-cols-3 *:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-full *:data-[slot=input-otp-slot]:text-xl'>
                                        <InputOTPSlot index={3} />
                                        <InputOTPSlot index={4} />
                                        <InputOTPSlot index={5} />
                                    </InputOTPGroup>
                                </InputOTP>
                                <FieldError errors={field.state.meta.errors} />
                            </Field>
                        )}
                    />

                    <FieldError errors={[error]} />

                    <form.Subscribe
                        selector={(s) => [s.canSubmit, s.isSubmitting]}
                        children={([canSubmit, isSubmitting]) => (
                            <Button
                                type='submit'
                                className='w-full'
                                disabled={!canSubmit}
                            >
                                {isSubmitting ? <Loader animateOnView /> : 'Confirm account'}
                            </Button>
                        )}
                    />
                </form>

                <div className='flex items-center justify-center'>
                    <Button
                        type='button'
                        variant='link'
                        className='p-0'
                        disabled={resent}
                        onClick={handleResend}
                    >
                        Resend code
                    </Button>
                </div>
            </div>
            <div className='flex items-center justify-center'>
                <Link
                    to='/signin'
                    className='text-sm'
                >
                    Back to sign in
                </Link>
            </div>
        </div>
    );
}
