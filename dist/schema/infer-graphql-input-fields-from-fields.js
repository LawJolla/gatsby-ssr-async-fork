"use strict";

exports.__esModule = true;

var _extends2 = require("babel-runtime/helpers/extends");

var _extends3 = _interopRequireDefault(_extends2);

exports.inferInputObjectStructureFromFields = inferInputObjectStructureFromFields;
exports.createSortField = createSortField;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _require = require(`graphql`),
    GraphQLInputObjectType = _require.GraphQLInputObjectType,
    GraphQLBoolean = _require.GraphQLBoolean,
    GraphQLString = _require.GraphQLString,
    GraphQLFloat = _require.GraphQLFloat,
    GraphQLInt = _require.GraphQLInt,
    GraphQLList = _require.GraphQLList,
    GraphQLEnumType = _require.GraphQLEnumType,
    GraphQLNonNull = _require.GraphQLNonNull,
    GraphQLScalarType = _require.GraphQLScalarType,
    GraphQLObjectType = _require.GraphQLObjectType,
    GraphQLInterfaceType = _require.GraphQLInterfaceType,
    GraphQLUnionType = _require.GraphQLUnionType;

var _require2 = require(`common-tags`),
    oneLine = _require2.oneLine;

var _ = require(`lodash`);
var invariant = require(`invariant`);
var typeOf = require(`type-of`);
var createTypeName = require(`./create-type-name`);
var createKey = require(`./create-key`);

var _require3 = require(`./data-tree-utils`),
    extractFieldExamples = _require3.extractFieldExamples,
    buildFieldEnumValues = _require3.buildFieldEnumValues,
    isEmptyObjectOrArray = _require3.isEmptyObjectOrArray;

function makeNullable(type) {
  if (type instanceof GraphQLNonNull) {
    return type.ofType;
  }
  return type;
}

function convertToInputType(type) {
  if (type instanceof GraphQLScalarType || type instanceof GraphQLEnumType) {
    return type;
  } else if (type instanceof GraphQLObjectType) {
    return new GraphQLInputObjectType({
      name: createTypeName(`${type.name}InputObject`),
      fields: _.transform(type.getFields(), function (out, fieldConfig, key) {
        try {
          var _type = convertToInputType(fieldConfig.type);
          out[key] = { type: _type };
        } catch (e) {
          console.log(e);
        }
      })
    });
  } else if (type instanceof GraphQLList) {
    return new GraphQLList(makeNullable(convertToInputType(type.ofType)));
  } else if (type instanceof GraphQLNonNull) {
    return new GraphQLNonNull(makeNullable(convertToInputType(type.ofType)));
  } else if (type instanceof GraphQLInterfaceType) {
    throw new Error(`GraphQLInterfaceType not yet implemented`);
  } else if (type instanceof GraphQLUnionType) {
    throw new Error(`GraphQLUnionType not yet implemented`);
  } else {
    throw new Error(`Invalid input type ${type && type.constructor && type.constructor.name}`);
  }
}

var scalarFilterMap = {
  Int: {
    eq: { type: GraphQLInt },
    ne: { type: GraphQLInt }
  },
  Float: {
    eq: { type: GraphQLFloat },
    ne: { type: GraphQLFloat }
  },
  String: {
    eq: { type: GraphQLString },
    ne: { type: GraphQLString },
    regex: { type: GraphQLString },
    glob: { type: GraphQLString }
  },
  Boolean: {
    eq: { type: GraphQLBoolean },
    ne: { type: GraphQLBoolean }
  }
};

function convertToInputFilter(prefix, type) {
  if (type instanceof GraphQLScalarType) {
    var name = type.name;
    var fields = scalarFilterMap[name];

    if (fields == null) {
      throw new Error(`Unknown scalar type for input filter`);
    }

    return new GraphQLInputObjectType({
      name: createTypeName(`${prefix}Query${name}`),
      fields: fields
    });
  } else if (type instanceof GraphQLInputObjectType) {
    return new GraphQLInputObjectType({
      name: createTypeName(`${prefix}{type.name}`),
      fields: _.transform(type.getFields(), function (out, fieldConfig, key) {
        try {
          var _type2 = convertToInputFilter(`${prefix}${_.upperFirst(key)}`, fieldConfig.type);
          out[key] = { type: _type2 };
        } catch (e) {
          console.log(e);
        }
      })
    });
  } else if (type instanceof GraphQLList) {
    var innerType = type.ofType;
    var innerFields = {};
    try {
      innerFields = convertToInputFilter(`${prefix}ListElem`, innerType).getFields();
    } catch (e) {
      console.log(e);
    }

    return new GraphQLInputObjectType({
      name: createTypeName(`${prefix}QueryList`),
      fields: (0, _extends3.default)({}, innerFields, {
        in: { type: new GraphQLList(innerType) }
      })
    });
  } else if (type instanceof GraphQLNonNull) {
    return convertToInputFilter(prefix, type.ofType);
  }

  throw new Error(`Unknown input field type`);
}

function extractFieldNamesFromInputField(prefix, type, accu) {
  if (type instanceof GraphQLScalarType || type instanceof GraphQLList) {
    accu.push(prefix);
  } else if (type instanceof GraphQLInputObjectType) {
    _.each(type.getFields(), function (fieldConfig, key) {
      extractFieldNamesFromInputField(`${prefix}___${key}`, fieldConfig.type, accu);
    });
  } else if (type instanceof GraphQLNonNull) {
    extractFieldNamesFromInputField(prefix, type.ofType, accu);
  } else {
    throw new Error(`Unknown input field type`);
  }
}

// convert output fields to output fields and a list of fields to sort on
function inferInputObjectStructureFromFields(_ref) {
  var fields = _ref.fields,
      _ref$typeName = _ref.typeName,
      typeName = _ref$typeName === undefined ? `` : _ref$typeName;

  var inferredFields = {};
  var sort = [];

  _.each(fields, function (fieldConfig, key) {
    try {
      var inputType = convertToInputType(fieldConfig.type);
      var filterType = convertToInputFilter(_.upperFirst(key), inputType);

      inferredFields[createKey(key)] = {
        type: filterType

        // Add sorting (but only to the top level).
      };if (typeName) {
        extractFieldNamesFromInputField(key, inputType, sort);
      }
    } catch (e) {
      console.log(key, fieldConfig, e);
    }
  });

  return { inferredFields, sort };
}

// builds an input field for sorting, given an array of names to sort on
function createSortField(typeName, fieldNames) {
  var enumValues = {};
  fieldNames.forEach(function (field) {
    enumValues[createKey(field)] = { value: field };
  });

  var SortByType = new GraphQLEnumType({
    name: `${typeName}SortByFieldsEnum`,
    values: enumValues
  });

  return {
    type: new GraphQLInputObjectType({
      name: _.camelCase(`${typeName} sort`),
      fields: {
        fields: {
          name: _.camelCase(`${typeName} sortFields`),
          type: new GraphQLNonNull(new GraphQLList(SortByType))
        },
        order: {
          name: _.camelCase(`${typeName} sortOrder`),
          defaultValue: `asc`,
          type: new GraphQLEnumType({
            name: _.camelCase(`${typeName} sortOrderValues`),
            values: {
              ASC: { value: `asc` },
              DESC: { value: `desc` }
            }
          })
        }
      }
    })
  };
}
//# sourceMappingURL=infer-graphql-input-fields-from-fields.js.map