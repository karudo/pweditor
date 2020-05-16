import React, {useState, useCallback} from 'react';

import styles from './editor.module.css'

const tags = ['Age', 'City', 'Country']
const modifiers = ['regular', 'cent', 'dollar']

const defaultEntity = {
  tagName: 'City',
  modifier: 'regular',
  defaultValue: ''
}

function Values({value, onChange}) {
  const onValueChange = (key, nv) => {
    onChange({
      ...value,
      [key]: nv
    })
  }
  return (
    <div>
      <div>
        <select value={value.tagName} onChange={e => onValueChange('tagName', e.target.value)} className={styles.inp}>
          {tags.map((tagName) => <option value={tagName} key={tagName}>{tagName}</option>)}
        </select>
      </div>
      <div>
        <select value={value.modifier} onChange={e => onValueChange('modifier', e.target.value)} className={styles.inp}>
          {modifiers.map((modifier) => <option value={modifier} key={modifier}>{modifier}</option>)}
        </select>
      </div>
      <div>
        <input type="text" value={value.defaultValue} onChange={e => onValueChange('defaultValue', e.target.value)} className={styles.inp}/>
      </div>
    </div>
  )
}

function AddNew({onAdd}) {
  const [value, setValue] = useState(defaultEntity);
  return (
    <div>
      <Values value={value} onChange={setValue} />
      <button onClick={() => onAdd(value)}>add</button>
    </div>
  )
}

export function TagSelect({value, onAdd, onChange}) {

  return value
    ? <Values value={value} onChange={onChange} />
    : <AddNew onAdd={onAdd} />

}
