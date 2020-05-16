import React, {useCallback, useEffect, useMemo, useRef} from 'react';
import './App.css';
import {Editor, EditorState, convertToRaw} from 'draft-js';
import {getSelectionRange, getSelectionCoords} from './utils';
import {Suka} from './pw/editor';

const es = EditorState.createEmpty();

function Toolbar({coords, state, onChange}) {
  return (
      <div onMouseDown={e => {
        console.log(e)
        e.stopPropagation()
        e.preventDefault()
      }} className="toolbar" style={coords}><button onClick={e => console.log(222)}>help</button></div>
  )
}

function MyEditor() {
  const ref = useRef();
  const [toolbar, setToolbar] = React.useState(null);
  const [editorState, setEditorState] = React.useState(es);
  const onChange = useCallback((state) => {
    if (!state.getSelection().isCollapsed()) {
      const selectionRange = getSelectionRange();

      if (!selectionRange) {
        setToolbar(null)
        return;
      }

      const selectionCoords = getSelectionCoords(selectionRange);

      setToolbar({
        top: selectionCoords.offsetTop,
        left: selectionCoords.offsetLeft
      })
    } else {
      setToolbar(null)
    }

    setEditorState(state)
    console.log(state.getLastChangeType(), convertToRaw(state.getCurrentContent()))
  }, [setToolbar, setEditorState])
  useEffect(() => ref.current.focus(), [])
  console.log(toolbar)
  return <>
    <div id="editor-container" className="editor" onClick={() => ref.current.focus()}>
      {toolbar && (<Toolbar coords={toolbar} state={editorState} onChange={onChange} />)}
      <Editor editorState={editorState} onChange={onChange} ref={ref} />
    </div>
  </>;
}

class MyEditor2 extends React.Component {

}

function App() {
  return (
    <div className="App">
      <Suka/>
    </div>
  );
}

export default App;
