import type { ComponentProps } from 'react';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FormFieldProps {
    field: {
        name: string;
        state: { value: string };
        handleChange: (value: string) => void;
    };
    label: string;
    type?: ComponentProps<typeof Input>['type'];
    placeholder?: string;
    min?: string;
    max?: string;
    step?: string;
}

export function FormField({ 
    field, 
    label, 
    type = 'text', 
    placeholder,
    min,
    max,
    step
}: FormFieldProps) {
    return (
        <Field>
            <Label htmlFor={field.name}>{label}</Label>
            <Input
                id={field.name}
                type={type}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={placeholder}
                min={min}
                max={max}
                step={step}
            />
        </Field>
    );
}