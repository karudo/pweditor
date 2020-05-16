import {
  EditorState,
  ContentBlock,
  genKey
} from 'draft-js';

import { List, Map } from 'immutable';

export const getSelectionRange = () => {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return null;

    return selection.getRangeAt(0);
};

export const getSelectionCoords = (selectionRange) => {
    const editorBounds = document.getElementById('editor-container').getBoundingClientRect();
    const rangeBounds = selectionRange.getBoundingClientRect();
    console.log(897, rangeBounds)
    const rangeWidth = rangeBounds.right - rangeBounds.left;
    // 107px is width of inline toolbar
    const offsetLeft = (rangeBounds.left - editorBounds.left) // + (rangeWidth / 2) - (107 / 2);
    // 42px is height of inline toolbar
    const offsetTop = rangeBounds.bottom - editorBounds.top;

    return { offsetLeft, offsetTop };
};

export const addNewBlockAt = (
  editorState,
  pivotBlockKey,
  newBlockType = 'unstyled',
  initialData = new Map({})
) => {
  const content = editorState.getCurrentContent();
  const blockMap = content.getBlockMap();
  const block = blockMap.get(pivotBlockKey);

  if (!block) {
    throw new Error(`The pivot key - ${ pivotBlockKey } is not present in blockMap.`);
  }

  const blocksBefore = blockMap.toSeq().takeUntil((v) => (v === block));
  const blocksAfter = blockMap.toSeq().skipUntil((v) => (v === block)).rest();
  const newBlockKey = genKey();

  const newBlock = new ContentBlock({
    key: newBlockKey,
    type: newBlockType,
    text: '',
    characterList: new List(),
    depth: 0,
    data: initialData,
  });

  const newBlockMap = blocksBefore.concat(
    [[pivotBlockKey, block], [newBlockKey, newBlock]],
    blocksAfter
  ).toOrderedMap();

  const selection = editorState.getSelection();

  const newContent = content.merge({
    blockMap: newBlockMap,
    selectionBefore: selection,
    selectionAfter: selection.merge({
      anchorKey: newBlockKey,
      anchorOffset: 0,
      focusKey: newBlockKey,
      focusOffset: 0,
      isBackward: false,
    }),
  });

  return EditorState.push(editorState, newContent, 'split-block');
};
