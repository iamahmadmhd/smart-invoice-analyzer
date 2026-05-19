import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError } from '@/components/ui/field';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { InputPassword } from '@/components/ui/input-password';
import { Label } from '@/components/ui/label';
import { Link } from '@/components/ui/link';
import { Loader } from '@/components/ui/loader';
import { useForm } from '@tanstack/react-form';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { confirmResetPassword } from 'aws-amplify/auth';
import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp';
import { useState } from 'react';
import { z } from 'zod';

const searchSchema = z.object({ email: z.string().default('') });

export const Route = createFileRoute('/(auth)/reset-password')({
    validateSearch: searchSchema,
    component: ResetPasswordPage,
});

const schema = z
    .object({
        code: z
            .string()
            .min(6, 'Enter the 6-digit code')
            .max(6, 'Code must be 6 digits')
            .regex(/^\d+$/, 'Code must be digits only'),
        password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/[A-Z]/, 'Password must contain an uppercase letter')
            .regex(/[0-9]/, 'Password must contain a number'),
        confirmPassword: z.string().min(8, 'Please confirm your password'),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

function ResetPasswordPage() {
    const navigate = useNavigate();
    const { email } = Route.useSearch();
    const [error, setError] = useState<{ message: string | undefined } | undefined>(undefined);

    const form = useForm({
        defaultValues: { code: '', password: '', confirmPassword: '' },
        validators: { onSubmit: schema },
        onSubmit: async ({ value }) => {
            setError(undefined);
            try {
                await confirmResetPassword({
                    username: email,
                    confirmationCode: value.code,
                    newPassword: value.password,
                });
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

    return (
        <div className='flex flex-col gap-6'>
            <div className='flex flex-col gap-6'>
                <div className='flex flex-col gap-2'>
                    <h1 className='text-2xl font-bold'>Set new password</h1>
                    <p className='text-sm text-muted-foreground'>
                        Enter the code sent to <span className='font-semibold'>{email}</span>
                    </p>
                </div>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.handleSubmit();
                    }}
                    className='flex flex-col gap-4'
                >
                    <form.Field
                        name='code'
                        validators={{ onChange: schema.shape.code }}
                        children={(field) => (
                            <Field>
                                <Label htmlFor={field.name}>Reset code</Label>
                                <InputOTP
                                    id={field.name}
                                    name={field.name}
                                    maxLength={6}
                                    pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                                    containerClassName='gap-4'
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={field.handleChange}
                                >
                                    <InputOTPGroup
                                        aria-in
                                        className='grid w-full grid-cols-3 *:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-full *:data-[slot=input-otp-slot]:text-xl'
                                    >
                                        <InputOTPSlot
                                            index={0}
                                            aria-invalid={!field.state.meta.isValid}
                                        />
                                        <InputOTPSlot
                                            index={1}
                                            aria-invalid={!field.state.meta.isValid}
                                        />
                                        <InputOTPSlot
                                            index={2}
                                            aria-invalid={!field.state.meta.isValid}
                                        />
                                    </InputOTPGroup>
                                    <InputOTPSeparator />
                                    <InputOTPGroup className='grid w-full grid-cols-3 *:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-full *:data-[slot=input-otp-slot]:text-xl'>
                                        <InputOTPSlot
                                            index={3}
                                            aria-invalid={!field.state.meta.isValid}
                                        />
                                        <InputOTPSlot
                                            index={4}
                                            aria-invalid={!field.state.meta.isValid}
                                        />
                                        <InputOTPSlot
                                            index={5}
                                            aria-invalid={!field.state.meta.isValid}
                                        />
                                    </InputOTPGroup>
                                </InputOTP>
                                <FieldError errors={field.state.meta.errors} />
                            </Field>
                        )}
                    />

                    <form.Field
                        name='password'
                        validators={{ onChange: schema.shape.password }}
                        children={(field) => (
                            <Field>
                                <Label htmlFor={field.name}>Password</Label>
                                <InputPassword
                                    id={field.name}
                                    name={field.name}
                                    autoComplete='new-password'
                                    placeholder='Min. 8 characters'
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    aria-invalid={!field.state.meta.isValid}
                                />
                                <FieldError errors={field.state.meta.errors} />
                            </Field>
                        )}
                    />

                    <form.Field
                        name='confirmPassword'
                        validators={{ onChange: schema.shape.confirmPassword }}
                        children={(field) => (
                            <Field>
                                <Label htmlFor={field.name}>Password</Label>
                                <InputPassword
                                    id={field.name}
                                    name={field.name}
                                    autoComplete='new-password'
                                    placeholder='Min. 8 characters'
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    aria-invalid={!field.state.meta.isValid}
                                />
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
                                {isSubmitting ? <Loader animateOnView /> : 'Reset password'}
                            </Button>
                        )}
                    />
                </form>

                <FieldDescription className='text-center'>
                    <Link to='/signin'>Back to sign in</Link>
                </FieldDescription>
            </div>
        </div>
    );
}
