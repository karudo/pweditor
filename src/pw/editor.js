import React from 'react';
import {Editor, EditorState, convertToRaw, convertFromRaw, Entity, Modifier, CompositeDecorator, SelectionState} from 'draft-js'
import * as utils from 'draftjs-utils'
import styles from './editor.module.css'
import {TagSelect} from './TagSelect';
import { Picker } from 'emoji-mart'
import 'emoji-mart/css/emoji-mart.css'

function findDynamicContent(contentBlock, callback, state) {
  contentBlock.findEntityRanges((character) => {
    console.log(character)
    const entityKey = character.getEntity();
    return (
      entityKey !== null &&
      state.getEntity(entityKey).getType() === 'DYNAMIC_CONTENT'
    );
  }, callback);
}

const DynamicContent = props => {
  return (
    <span className={styles.placeholder}>
      {props.children}
    </span>
  )
}

const decorator = new CompositeDecorator([{
  strategy: findDynamicContent,
  component: DynamicContent,
}]);

function findEntity(editorState, entityKey) {
  const content = editorState.getCurrentContent();
  let entityRange;
  content.getBlockMap().forEach((block, k) => {
    block.findEntityRanges(
      value => value.get('entity') === entityKey,
      (start, end) => {
        entityRange = {
          start,
          end,
          text: block.get('text').slice(start, end),
        };
      }
    );
  })
  return {
    ...entityRange,
    data: content.getEntity(entityKey).getData()
  }
}

function isCursorMoveLeft(range, prevSelection, nextSelection) {
  if (prevSelection.isCollapsed() && nextSelection.isCollapsed()) {
    if (
      prevSelection.getStartKey() === nextSelection.getStartKey()
      && prevSelection.getStartOffset() === range.end
      && nextSelection.getStartOffset() < prevSelection.getStartOffset()
    ) {
      return true;
    }
  }
  return false;
}

export class Suka extends React.Component {
  constructor(props) {
    super(props);
    this.state = this.getInitialState()
    this.editor = React.createRef()
  }

  getInitialState() {
    return {
      editorState: EditorState.createEmpty(decorator),
      selectedEntityKey: null,
    }
  }

  onChange = (nextEditorState, cb) => {
    const selectedEntityKey = utils.getSelectionEntity(nextEditorState)
    console.log(selectedEntityKey)
    if (selectedEntityKey) {
      console.log(findEntity(nextEditorState, selectedEntityKey))
      const prevEditorState = this.state.editorState;
      const prevContent = prevEditorState.getCurrentContent();
      const nextContent = nextEditorState.getCurrentContent();
      if (prevContent === nextContent) {
        const prevSelection = prevEditorState.getSelection();
        const nextSelection = nextEditorState.getSelection();
        if (prevSelection.isCollapsed() && nextSelection.isCollapsed() && prevSelection.getStartOffset() !== nextSelection.getStartOffset()) {
          const selectedBlock = utils.getSelectedBlock(nextEditorState)
          const entityRange = utils.getEntityRange(nextEditorState, selectedEntityKey);
          //this.mama = [selectedBlock.getKey(), selectedEntityKey, entityRange];
          const offset = isCursorMoveLeft(entityRange, prevSelection, nextSelection)
            ? entityRange.start
            : entityRange.end

          const updateSelection = SelectionState.createEmpty(selectedBlock.getKey()).merge({
            anchorOffset: offset,
            focusOffset: offset,
          });

          nextEditorState = EditorState.forceSelection(nextEditorState, updateSelection);
        }
      }

    }
    // console.log(utils.getSelectionEntity(nextEditorState))
    console.log('before on')
    this.setState({
      selectedEntityKey,
      editorState: nextEditorState
    }, cb)
  }

  logState = () => {
    const content = this.state.editorState.getCurrentContent();
    console.log(convertToRaw(content));
  }

  focus = () => {
    this.editor.current.focus();
  }

  insertEmoji = (em) => {
    const editorState = this.state.editorState;
    const currentContent = editorState.getCurrentContent();
    const selection = editorState.getSelection();
    if (!selection.isCollapsed()) {
      return;
    }
    const textWithEntity = Modifier.insertText(currentContent, selection, em);
    const newState = EditorState.push(editorState, textWithEntity, 'insert-characters');
    this.onChange(newState, () => this.focus());
  }

  insertDynamicContent = (dynamicContent) => {
    const editorState = this.state.editorState;
    const currentContent = editorState.getCurrentContent();
    const selection = editorState.getSelection();
    if (!selection.isCollapsed()) {
      return;
    }
    const contentStateWithEntity = currentContent.createEntity('DYNAMIC_CONTENT', 'IMMUTABLE', dynamicContent);
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    const textWithEntity = Modifier.insertText(currentContent, selection, `{${dynamicContent.tagName}|${dynamicContent.modifier}|${dynamicContent.defaultValue}}`, null, entityKey);
    //const textWithEntity = Modifier.applyEntity(currentContent, selection, entityKey);
    const newState = EditorState.push(editorState, textWithEntity, 'insert-characters');
    this.onChange(newState, () => this.focus());
  }

  updateDynamicContent = (dynamicContent) => {
    const editorState = this.state.editorState
    const entityKey = utils.getSelectionEntity(editorState)
    const selectedBlock = utils.getSelectedBlock(editorState)
    const blockKey = selectedBlock.getKey()
    const entityRange = utils.getEntityRange(editorState, entityKey);
    const blockSelection = SelectionState
      .createEmpty(blockKey)
      .merge({
        anchorOffset: entityRange.start,
        focusOffset: entityRange.end,
      });
    let contentState = editorState.getCurrentContent();
    contentState = Modifier.replaceText(
      contentState,
      blockSelection,
      `{${dynamicContent.tagName}|${dynamicContent.modifier}|${dynamicContent.defaultValue}}`,
      null,
      entityKey
    ).replaceEntityData(entityKey, dynamicContent)
    this.setState({
      editorState: EditorState.push(
        editorState,
        contentState,
      )
    })
    //Modifier.replaceText()
  }

  handleBeforeInput = () => (...args) => { console.log(args) }
  handleKeyCommand = (...args) => { console.log(77, args) }

  render() {
    const selectedEntityData = this.state.selectedEntityKey && this.state.editorState.getCurrentContent().getEntity(this.state.selectedEntityKey).getData()
    console.log(117, selectedEntityData)
    return (
      <div className={styles.wrapper}>
        <div className={styles.editor} onClick={this.focus}>
          <Editor editorState={this.state.editorState}
                  handleBeforeInput={this.handleBeforeInput()}
                  handleKeyCommand={this.handleKeyCommand()}
                  ref={this.editor}
                  onChange={this.onChange}

          />
        </div>
        <div>
          <TagSelect value={selectedEntityData} onAdd={this.insertDynamicContent} onChange={this.updateDynamicContent} />
          <hr/>
          <Picker onSelect={q => this.insertEmoji(q.native)}/>
        </div>
      </div>
    );
  }
}

function EmoSel() {
  return (
    <div>

    </div>
  )
}
