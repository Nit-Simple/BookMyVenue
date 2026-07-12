import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Mail, MapPin, Phone } from 'lucide-react';
import { Button, Card, Input, Textarea } from '@/components/ui';

const schema = z.object({
  name: z.string().min(2, 'Please enter your name'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  message: z.string().min(10, 'Please add a few more details'),
});
type Values = z.infer<typeof schema>;

const CONTACTS = [
  { icon: Mail, label: 'Email', value: 'partners@bookmyvenue.com' },
  { icon: Phone, label: 'Phone', value: '+91 1800 000 000' },
  { icon: MapPin, label: 'Office', value: 'Bengaluru, India' },
];

export default function ContactPage() {
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: '', email: '', message: '' } });

  const onSubmit = async () => {
    // TODO(backend): no contact endpoint. Simulate success.
    await new Promise((r) => setTimeout(r, 600));
    toast.success('Thanks! We’ll get back to you shortly.');
    form.reset();
  };

  return (
    <>
      <section className="border-b border-slate-100 bg-brand-50">
        <div className="container-app py-16 text-center">
          <h1 className="font-display text-4xl font-extrabold text-slate-900">Get in touch</h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            Questions about listing your venue? We’d love to help.
          </p>
        </div>
      </section>

      <section className="container-app grid grid-cols-1 gap-8 py-16 lg:grid-cols-3">
        <div className="space-y-4">
          {CONTACTS.map((c) => (
            <Card key={c.label} className="flex items-center gap-3 p-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <c.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs text-slate-500">{c.label}</p>
                <p className="text-sm font-medium text-slate-900">{c.value}</p>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-6 lg:col-span-2">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Name" required error={form.formState.errors.name?.message} {...form.register('name')} />
              <Input label="Email" type="email" required error={form.formState.errors.email?.message} {...form.register('email')} />
            </div>
            <Textarea label="Message" rows={5} required error={form.formState.errors.message?.message} {...form.register('message')} />
            <Button type="submit" isLoading={form.formState.isSubmitting}>
              Send message
            </Button>
            <p className="text-xs text-slate-400">
              Note: the contact form is not yet wired to a backend endpoint. (TODO backend)
            </p>
          </form>
        </Card>
      </section>
    </>
  );
}
