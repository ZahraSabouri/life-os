import { useState } from 'react'
import './ShoppingList.css'

const CATEGORIES = [
  { id: 'groceries', label: 'Groceries' },
  { id: 'toiletries', label: 'Toiletries' },
  { id: 'household', label: 'Household' },
  { id: 'other', label: 'Other' },
]

const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((entry) => [entry.id, entry.label]))

function ShoppingRow({ item, onToggle, onRemove }) {
  return (
    <li className={item.done ? 'is-done' : undefined}>
      <label>
        <input type="checkbox" checked={item.done} onChange={() => onToggle(item.id)} />
        <span className="shopping-item-text">{item.text}</span>
        <span className="shopping-item-category">{CATEGORY_LABEL[item.category] ?? 'Other'}</span>
      </label>
      <button
        type="button"
        className="shopping-item-remove"
        onClick={() => onRemove(item.id)}
        aria-label={`Remove ${item.text} from the shopping list`}
      >
        ×
      </button>
    </li>
  )
}

/**
 * A running "things to buy" list — deliberately separate from cards: buying
 * shampoo isn't academic backlog, so nothing here touches progress, dates,
 * or capacity. Add it, check it off when it's bought, done.
 */
export function ShoppingList({ items = [], onAdd, onToggle, onRemove, onClearBought }) {
  const [text, setText] = useState('')
  const [category, setCategory] = useState('other')

  function submit(event) {
    event.preventDefault()
    const clean = text.trim()
    if (!clean) return
    onAdd(clean, category)
    setText('')
  }

  const open = items.filter((item) => !item.done)
  const bought = items.filter((item) => item.done)

  return (
    <section className="panel shopping-list" aria-labelledby="shopping-list-title">
      <p className="eyebrow">Life &amp; admin</p>
      <h2 id="shopping-list-title">Shopping list</h2>
      <p className="muted small">
        Anything you're out of — toiletries, groceries, household bits. Add it here, check it off when it's bought.
      </p>
      <form className="shopping-list-form" onSubmit={submit}>
        <input
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="e.g. shampoo, bin liners, perfume"
          aria-label="New shopping list item"
        />
        <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Item category">
          {CATEGORIES.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.label}
            </option>
          ))}
        </select>
        <button type="submit" className="ghost-button">
          Add
        </button>
      </form>
      {open.length === 0 && bought.length === 0 && <p className="muted small">Nothing on the list right now.</p>}
      {open.length > 0 && (
        <ul className="shopping-list-items">
          {open.map((item) => (
            <ShoppingRow key={item.id} item={item} onToggle={onToggle} onRemove={onRemove} />
          ))}
        </ul>
      )}
      {bought.length > 0 && (
        <details className="shopping-list-bought">
          <summary>{bought.length} bought</summary>
          <ul className="shopping-list-items">
            {bought.map((item) => (
              <ShoppingRow key={item.id} item={item} onToggle={onToggle} onRemove={onRemove} />
            ))}
          </ul>
          <button type="button" className="ghost-button" onClick={onClearBought}>
            Clear bought items
          </button>
        </details>
      )}
    </section>
  )
}
