"use strict";

exports.__esModule = true;

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _glob = require("glob");

var _glob2 = _interopRequireDefault(_glob);

var _graphql = require("graphql");

var _invariant = require("invariant");

var _invariant2 = _interopRequireDefault(_invariant);

var _relayCompiler = require("relay-compiler");

var _ASTConvert = require("relay-compiler/lib/ASTConvert");

var _ASTConvert2 = _interopRequireDefault(_ASTConvert);

var _RelayCompilerContext = require("relay-compiler/lib/RelayCompilerContext");

var _RelayCompilerContext2 = _interopRequireDefault(_RelayCompilerContext);

var _filterContextForNode = require("relay-compiler/lib/filterContextForNode");

var _filterContextForNode2 = _interopRequireDefault(_filterContextForNode);

var _redux = require("../../redux");

var _fileParser = require("./file-parser");

var _fileParser2 = _interopRequireDefault(_fileParser);

var _queryPrinter = require("./query-printer");

var _queryPrinter2 = _interopRequireDefault(_queryPrinter);

var _graphqlErrors = require("./graphql-errors");

var _reporter = require("../../reporter");

var _reporter2 = _interopRequireDefault(_reporter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const normalize = require(`normalize-path`);

const _ = require(`lodash`);

const { printTransforms } = _relayCompiler.IRTransforms;

const {
  ArgumentsOfCorrectTypeRule,
  DefaultValuesOfCorrectTypeRule,
  FragmentsOnCompositeTypesRule,
  KnownTypeNamesRule,
  LoneAnonymousOperationRule,
  PossibleFragmentSpreadsRule,
  ScalarLeafsRule,
  VariablesAreInputTypesRule,
  VariablesInAllowedPositionRule
} = require(`graphql`);

const validationRules = [ArgumentsOfCorrectTypeRule, DefaultValuesOfCorrectTypeRule, FragmentsOnCompositeTypesRule, KnownTypeNamesRule, LoneAnonymousOperationRule, PossibleFragmentSpreadsRule, ScalarLeafsRule, VariablesAreInputTypesRule, VariablesInAllowedPositionRule];

class Runner {

  constructor(baseDir, schema) {
    this.baseDir = baseDir;
    this.schema = schema;
  }

  reportError(message) {
    _reporter2.default.log(`${_reporter2.default.format.red(`GraphQL Error`)} ${message}`);
  }

  async compileAll() {
    let nodes = await this.parseEverything();
    return await this.write(nodes);
  }

  async parseEverything() {
    // FIXME: this should all use gatsby's configuration to determine parsable
    // files (and how to parse them)
    let files = _glob2.default.sync(`${this.baseDir}/**/*.+(t|j)s?(x)`);
    files = files.filter(d => !d.match(/\.d\.ts$/));
    files = files.map(normalize);

    // Ensure all page components added as they're not necessarily in the
    // pages directory e.g. a plugin could add a page component.  Plugins
    // *should* copy their components (if they add a query) to .cache so that
    // our babel plugin to remove the query on building is active (we don't
    // run babel on code in node_modules). Otherwise the component will throw
    // an error in the browser of "graphql is not defined".
    files = files.concat(Object.keys(_redux.store.getState().components).map(c => normalize(c)));
    files = _.uniq(files);

    let parser = new _fileParser2.default();

    return await parser.parseFiles(files);
  }

  async write(nodes) {
    const compiledNodes = new Map();
    const namePathMap = new Map();
    const nameDefMap = new Map();
    const documents = [];

    for (let [filePath, doc] of nodes.entries()) {
      let errors = (0, _graphql.validate)(this.schema, doc, validationRules);

      if (errors && errors.length) {
        this.reportError((0, _graphqlErrors.graphqlValidationError)(errors, filePath));
        return compiledNodes;
      }

      documents.push(doc);
      doc.definitions.forEach(def => {
        const name = def.name.value;
        namePathMap.set(name, filePath);
        nameDefMap.set(name, def);
      });
    }

    let compilerContext = new _RelayCompilerContext2.default(this.schema);
    try {
      compilerContext = compilerContext.addAll(_ASTConvert2.default.convertASTDocuments(this.schema, documents, validationRules));
    } catch (error) {
      this.reportError((0, _graphqlErrors.graphqlError)(namePathMap, nameDefMap, error));
      return compiledNodes;
    }

    const printContext = printTransforms.reduce((ctx, transform) => transform(ctx, this.schema), compilerContext);

    compilerContext.documents().forEach(node => {
      if (node.kind !== `Root`) return;

      const { name } = node;
      let filePath = namePathMap.get(name) || ``;

      if (compiledNodes.has(filePath)) {
        let otherNode = compiledNodes.get(filePath);
        this.reportError((0, _graphqlErrors.multipleRootQueriesError)(filePath, nameDefMap.get(name), otherNode && nameDefMap.get(otherNode.name)));
        return;
      }

      let text = (0, _filterContextForNode2.default)(printContext.getRoot(name), printContext).documents().map(_queryPrinter2.default.print).join(`\n`);

      compiledNodes.set(filePath, {
        name,
        text,
        path: _path2.default.join(this.baseDir, filePath)
      });
    });

    return compiledNodes;
  }
}

exports.default = async function compile() {
  const { program, schema } = _redux.store.getState();

  const runner = new Runner(`${program.directory}/src`, schema);

  const queries = await runner.compileAll();

  return queries;
};
//# sourceMappingURL=query-compiler.js.map