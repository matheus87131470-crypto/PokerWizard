import { useState } from 'react';
import PremiumModal from '../PremiumModal';
import { Button } from '@/components/ui/button';

export default function PremiumModalExample() {
  const [open, setOpen] = useState(true);

  return (
    <div className="p-6">
      <Button onClick={() => setOpen(true)}>Open Premium Modal</Button>
      <PremiumModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
