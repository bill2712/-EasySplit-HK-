import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { parseAmount } from '../lib/money';
import type { Item } from '../lib/types';
import { useI18n } from '../i18n';
import { AmountInput, Chip, IconButton, Stepper } from './ui';

export function ItemRow({
  item,
  index,
  people,
  currency,
  onChange,
  onRemove,
}: {
  item: Item;
  index: number;
  people: { id: string; name: string }[];
  currency: string;
  onChange: (patch: Partial<Item>) => void;
  onRemove: () => void;
}) {
  const { t } = useI18n();
  const [priceText, setPriceText] = useState(item.price ? String(item.price) : '');
  const all = item.who.length === 0;
  return (
    <div className="card animate-pop space-y-3 p-3">
      <div className="flex items-center gap-2">
        <input
          value={item.name}
          aria-label={t('quick.itemName')}
          placeholder={t('quick.itemN', { n: index + 1 })}
          onChange={(e) => onChange({ name: e.target.value })}
          className="field min-w-0 flex-1"
        />
        <AmountInput
          className="w-32"
          prefix={currency}
          value={priceText}
          ariaLabel={t('quick.price')}
          onChange={(v) => {
            setPriceText(v);
            onChange({ price: parseAmount(v) ?? 0 });
          }}
        />
        <IconButton label={t('common.delete')} onClick={onRemove}>
          <Trash2 className="h-5 w-5 text-zinc-400" />
        </IconButton>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-zinc-500">{t('quick.qty')}</span>
        <Stepper value={item.qty || 1} onChange={(qty) => onChange({ qty })} min={1} max={99} />
        <span className="ml-auto text-xs text-zinc-500">{t('quick.sharedBy')}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Chip active={all} onClick={() => onChange({ who: [] })}>
          {t('common.everyone')}
        </Chip>
        {people.map((p) => {
          const on = item.who.includes(p.id);
          return (
            <Chip key={p.id} active={on} onClick={() => onChange({ who: on ? item.who.filter((w) => w !== p.id) : [...item.who, p.id] })}>
              {p.name}
            </Chip>
          );
        })}
      </div>
    </div>
  );
}
