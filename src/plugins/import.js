/* eslint-disable */
import postcss from 'postcss';
import valueParser from 'postcss-value-parser';
// ICSS {String}
// import { createICSSRules } from "icss-utils";

const getArg = nodes =>
  (nodes.length !== 0 && nodes[0].type === 'string'
    ? nodes[0].value
    : valueParser.stringify(nodes));

const getUrl = (node) => {
  if (node.type === 'function' && node.value === 'url') {
    return getArg(node.nodes);
  }
  if (node.type === 'string') {
    return node.value;
  }
  return '';
};

const parseImport = (params) => {
  const { nodes } = valueParser(params);

  if (nodes.length === 0) {
    return null;
  }

  const url = getUrl(nodes[0]);

  if (url.trim().length === 0) {
    return null;
  }

  return {
    url,
    media: valueParser.stringify(nodes.slice(1)).trim(),
  };
};

const isExternalUrl = url => /^\w+:\/\//.test(url) || url.startsWith('//');

const walkImports = (css, callback) => {
  css.each((node) => {
    if (node.type === 'atrule' && node.name.toLowerCase() === 'import') {
      callback(node);
    }
  });
};

const plugin = 'postcss-icss-import';

export default postcss.plugin(plugin, () => (css, result) => {
  walkImports(css, (atrule) => {
    if (atrule.nodes) {
      return result.warn(
        'It looks like you didn\'t end your @import statement correctly.\nChild nodes are attached to it.',
        { node: atrule },
      );
    }

    const parsed = parseImport(atrule.params);

    if (parsed === null) {
      return result.warn(`Unable to find uri in '${atrule.toString()}'`, {
        node: atrule,
      });
    }
    
    let idx = 0;
    const url = parsed.url;

    if (!isExternalUrl(url)) {
      atrule.remove();

      result.messages.push({
        type: 'import',
        plugin: 'postcss-icss-import',
        import: `import CSS__IMPORT__${idx} from '${url}';\n`
      })

      idx++;
    }
  });
});