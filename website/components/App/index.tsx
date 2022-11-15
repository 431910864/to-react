import * as React from 'react';
import { usePersist } from 'react-hooks-set';
import { transformCode } from '../../../src/index';
import initalCode, { initalCode1 } from '../../common/util/initalCode';
import ResizableContainer from '../ResizableContainer';
import Header, { SelectType } from '../Header';
import CodeEditor from '../CodeEditor';
import Console from '../Console';
import { Log } from '../../common/util/types';

import * as styles from './index.less';

const extractReactComponents = require("html-to-react-components");

const App: React.FC = () => {
  var sourceCode: any, setSourceCode: any;
  const [sourceVueCode, setSourceVueCode] = usePersist(
    'sourceVueCode',
    initalCode,
    true
  );
  const [sourceHtmlCode, setSourceHtmlCode] = usePersist(
    'sourceHtmlCode',
    initalCode1,
    true
  );
  const [selectValue, onSelect] = usePersist(
    'selectType',
    SelectType.HTML,
    true
  );
  if (selectValue === SelectType.Vue) {
    sourceCode = sourceVueCode
    setSourceCode = setSourceVueCode
  } else {
    sourceCode = sourceHtmlCode
    setSourceCode = setSourceHtmlCode
  }
  const [targetCode, setTargetCode] = React.useState('');
  const [logging, setLogging] = React.useState([] as Log[]);

  const [workspaceWeights, setWorkspaceWeights] = React.useState([2, 2, 1.2]);
  const [workspaceVisibles, setWorkspaceVisibles] = React.useState([
    true,
    true,
    true
  ]);

  const handleUpdateCode = (code: string): void => {
    setSourceCode(code);
  };

  const handleTransformCode = () => {
    try {
      if (selectValue === SelectType.Vue) {
        const [script, , logHistory] = transformCode(sourceCode);
        setTargetCode(script);
        setLogging(logHistory);
        logHistory.forEach((log: Log) => {
          window.$sentry && window.$sentry.report(log);
        });
      } else {
        setTargetCode(extractReactComponents(sourceCode, {
          componentType: "stateless",
          moduleType: false
        })?.Header?.replace?.(/classname/g, 'className'))
      }
    } catch (error) {
      setTargetCode('');
      setLogging([{ msg: error.toString(), type: 'error' }]);
      window.$sentry &&
        window.$sentry.report({ msg: error.toString(), type: 'error' });
    }
  };

  return (
    <div className={styles.app}>
      <Header
        onSelect={onSelect}
        selectValue={selectValue}
        sourceCode={sourceCode}
        targetCode={targetCode}
        onTransformCode={handleTransformCode}
        onUpdateCode={handleUpdateCode}
      />
      <ResizableContainer
        className={styles.workspace}
        horizontal
        weights={workspaceWeights}
        visibles={workspaceVisibles}
        onChangeWeights={(workspaceWeights: number[]): void =>
          setWorkspaceWeights(workspaceWeights)
        }
      >
        <CodeEditor code={sourceCode} onUpdateCode={handleUpdateCode} />
        <CodeEditor code={targetCode} readOnly={true} />
        <Console logging={logging} title="Console" />
      </ResizableContainer>
    </div>
  );
};

export default App;
