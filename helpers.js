import { assign } from '@xstate/immer';

// Symbols for child tags
const symbols = {
  state: Symbol("state"),
  transition: Symbol("transition"),
  childConfig: Symbol("childConfig"),
  invoke: Symbol("invoke"),
};

export const setTagSymbol = (tag) => ({
  [symbols.state]: tag === "state",
  [symbols.transition]: tag === "transition",
  [symbols.childConfig]: tag === "childConfig",
  [symbols.invoke]: tag === "invoke",
});

/*
      - An atomic state node has no child states. (I.e., it is a leaf node.)
      - A compound state node contains one or more child states, and has an initial state, which is the key of one of those child states.
      - A parallel state node contains two or more child states, and has no initial state, since it represents being in all of its child states at the same time.
      - A final state node is a leaf node that represents an abstract "terminal" state.
      - A history state node is an abstract node that represents resolving to its parent node's most recent shallow or deep history state.
  */
export const getStateNodeType = (stateNode) =>
  stateNode.type ||
  stateNode.compound ||
  stateNode.parallel ||
  stateNode.final ||
  stateNode.history ||
  undefined;

export const hasChildStates = (stateNode) =>
  getStateNodeType(stateNode) === "compound" ||
  getStateNodeType(stateNode) === "parallel" ||
  getStateNodeType(stateNode) === "history";

export const byTag = (tagName) => (node) => node[symbols[tagName]] === true;

export const isConfigSpecified = (firstChild) => !firstChild[symbols.state];

// no extra processing needed- matches Xstate object
export const mergeChildOpts = (children) =>
  children.reduce((a, b) => Object.assign(a, b), {});

// helpers for merging child tags

export const mergeStateTags = (children) => {
  const states = children.filter(byTag("state")).reduce((acc, curr) => {
    const { id, ...restCurr } = curr;
    return {
      ...acc,
      [id]: {
        ...restCurr,
      },
    };
  }, {});
  if (Object.values(states).length) {
    return { states };
  }
  return {};
};

export const mergeInvokeTag = (children) =>
  children.find(byTag("invoke")) || {};

export const mergeTransitionTags = (children) => {
  const transitions = children.filter(byTag("transition")).reduce(
    ({ on }, { event, target, ...attrs }) => ({
      on: {
        ...on,
        [event]: { target, ...attrs },
      },
    }),
    { on: {} }
  );
  if (Object.values(transitions).length) {
    return transitions;
  }
  return {};
};

// helpers for mapping attributes to scxml
export const mapStateAttrs = (attrs) => {
  const { "on-entry": entry, "on-exit": exit, ...restAttrs } = attrs;
  return {
    entry,
    exit,
    ...restAttrs,
  };
};

export const mapMutationsToActions = (options) =>
  Object.entries(options.mutations || {}).reduce(
    (a, [k, f]) => ({
      ...a,
      [k]: (...args) => assign(f(...args)),
    }),
    {}
  );

export const getOptsAndChildStates = (props) => {
  const [firstChild, ...restChildren] = props.children;

  let states = {};
  let opts = {};

  if (isConfigSpecified(firstChild)) {
    opts = firstChild;
    states = mergeStateTags(restChildren);
  } else {
    states = mergeStateTags(props.children);
  }
  return { opts, states };
};
