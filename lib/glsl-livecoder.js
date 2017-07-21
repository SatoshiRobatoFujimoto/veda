'use babel';

import GlslLivecoderView from './glsl-livecoder-view';
import validator from './validator';
import ThreeShader from './three-shader';

const DEFAULT_SHADER = `
precision mediump float;
uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

void main() {
	vec2 uv = gl_FragCoord.xy / resolution.xy;
	gl_FragColor = vec4(uv,0.5+0.5*sin(time),1.0);
}
`;

export default class GlslLivecoder {
  // view: GlslLivecoderView;
  // editor: TextEditor;
  // three: ThreeShader;

  constructor() {
    this.view = new GlslLivecoderView();
    atom.workspace.element.appendChild(this.view.getElement());

    // this.three = new ThreeShader(1, 3);
    this.three = new ThreeShader(2, 2);
    this.three.setCanvas(this.view.getCanvas());

    this.state = {
      isPlaying: false,
    };
  }

  destroy() {
    this.three.stop();
    this.view.destroy();
  }

  setValidatorPath(path) {
    this.glslangValidatorPath = path;
  }

  toggle() {
    return (
      this.state.isPlaying ?
        this.stop() :
        this.play()
    );
  }

  play() {
    this.view.show();
    this.three.loadShader(DEFAULT_SHADER);
    this.three.play();
    this.state.isPlaying = true;
  }

  stop() {
    this.view.hide();
    this.three.stop();
    this.state.isPlaying = false;
    this.stopWatching();
  }

  watchActiveShader() {
    if (this.state.activeEditorDisposer) {
      return;
    }

    this.watchShader();
    this.state.activeEditorDisposer = atom.workspace.onDidChangeActiveTextEditor(() => {
      this.watchShader();
    });
  }

  watchShader() {
    if (this.state.editorDisposer) {
      this.state.editorDisposer.dispose();
      this.state.editorDisposer = null;
    }

    this.editor = atom.workspace.getActiveTextEditor();
    this.loadShaderOfEditor(this.editor);

    this.state.editorDisposer = this.editor.onDidStopChanging(() => {
      this.loadShaderOfEditor(this.editor);
    });
  }

  loadShader() {
    const editor = atom.workspace.getActiveTextEditor();
    this.loadShaderOfEditor(editor);
  }

  stopWatching() {
    this.editor = null;
    if (this.state.activeEditorDisposer) {
      this.state.activeEditorDisposer.dispose();
      this.state.activeEditorDisposer = null;
    }
    if (this.state.editorDisposer) {
      this.state.editorDisposer.dispose();
      this.state.editorDisposer = null;
    }
  }

  /**
   * @private
   */
  loadShaderOfEditor(editor) {
    if (!editor) {
      return;
    }

    const shader = editor.getText();

    validator(this.glslangValidatorPath, shader)
      .then(() => {
        this.three.loadShader(shader);
      })
      .catch(e => {
        console.error(e);
      });
  }
}