import {
  getOptsAndChildStates,
  mapMutationsToActions,
  mapStateAttrs,
  mergeInvokeTag,
  mergeStateTags,
  mergeTransitionTags,
  mergeChildOpts,
  setTagSymbol,
} from "./helpers";

import { Machine } from "xstate";

const tagMappers = {
  machine: (tag, attrs, children) => {
    const props = { ...attrs, children };
    const { states, opts } = getOptsAndChildStates(props);

    const { id, initial, config = {}, type } = props;

    const options = { ...config, ...opts };

    const { context = {}, guards, activities, delays, services } = options;

    return Machine(
      {
        id,
        context,
        initial,
        type,
        ...config,
        ...states,
      },
      {
        actions: {
          ...opts.actions,
          ...mapMutationsToActions(options),
        },
        guards,
        activities,
        delays,
        services,
      }
    );
  },
  state: (tag, attrs, children) => {
    return {
      ...mapStateAttrs(attrs),
      ...mergeTransitionTags(children),
      ...mergeInvokeTag(children),
      ...mergeStateTags(children),
      ...setTagSymbol("state"),
    };
  },
  transition: (tag, attrs, children) => {
    return {
      ...attrs,
      ...setTagSymbol("transition"),
    };
  },
  invoke: (tag, attrs, children) => {
    return {
      invoke: {
        ...attrs,
        ...mergeChildOpts(children),
      },
      ...setTagSymbol("invoke"),
    };
  },
  "on-done": (tag, attrs, children) => {
    return { onDone: { ...attrs } };
  },
  "on-error": (tag, attrs, children) => {
    return { onError: { ...attrs } };
  },
};

export default function statechart(tag, attrs, ...children) {
  if (typeof tag === "function") {
    return tag({ ...attrs, children });
  }
  if (typeof tag === "string") {
    if (tagMappers[tag]) {
      return tagMappers[tag](tag, attrs, children);
    }
    throw new Error("[JSX]: No tag corresponding to: ", tag);
  }
}
