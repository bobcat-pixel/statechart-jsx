# statechart-jsx

This is is an *experimental* JSX pragma that allows one to use xstate while following SCXML idioms as closely as possible. 

Xstate is quite an amazing library, but the syntax can be challenging as JavaScript's data structures aren't particularly amenable to expressing state machines. For those who find SCXML easier to grok, this should make development easier. Nesting state machines together is just like nesting React components.

PRs and feedback are welcome!

Obligatory traffic light example:

```
/** @jsx statechart */
import statechart from "./index";

// hierarchical parallel state nodes, traffic light
const WalkSignNode = () => (
  <state id="walkSign">
    <state initial="solid">
      <state id="solid">
        <transition event="COUNTDOWN" target="flashing" />
      </state>
      <state id="flashing">
        <transition event="STOP_COUNTDOWN" target="solid" />
      </state>
    </state>
  </state>
);

const PedestrianNode = () => (
  <state id="pedestrian" initial="walk" compound>
    <state id="walk">
      <transition event="COUNTDOWN" target="wait" />
    </state>
    <state id="wait">
      <transition event="STOP_COUNTDOWN" target="stop" />
    </state>
    <state id="stop" final />
  </state>
);

const Light = () => (
  <machine initial="green">
    <state id="green">
      <transition event="TIMER" target="yellow" />
    </state>
    <state id="yellow">
      <transition event="TIMER" target="red" />
    </state>
    <state id="red" type="parallel">
        <WalkSignNode />
        <PedestrianNode />
    </state>
  </machine>
);

// non-parallel hierchical state nodes
const Crosswalk = () => (
  <state initial="walk">
    <state id="walk">
      <transition event="PED_COUNTDOWN" target="wait" />
    </state>
    <state id="wait">
      <transition event="PED_COUNTDOWN" target="walk" />
    </state>
    <state id="stop" />
    <state id="blinking" />
  </state>
);

const TrafficLight = () => (
  <machine initial="green">
    <state id="green">
      <transition event="TIMER" target="yellow" />
    </state>
    <state id="yellow">
      <transition event="TIMER" target="red" />
    </state>
    <state id="red">
      <transition event="TIMER" target="green" />
      <Crosswalk />
    </state>
    <transition event="POWER_OUTAGE" target=".red" />
    <transition event="POWER_RESTORED" target=".red.blinking" />
  </machine>
);
```

Differences from SCXML
----------------------

In some instances I've deferred to the xstate way of doing things

- Instead of `<parallel>` tags, there is a type="parallel" property just like in xstate
- Addition of `<machine>` tag
- Instead of a `<script>` tag, configuration can be passed in a config prop to `machine`, or otherwise specified in an inline JS expression after the initial `<machine>` tag.
- Tags like `<if>` are disregarded in favor of inline JS expressions
- Tags like `<assign>` and `<data>` are disregarded in favor of xstate-style config objects passed as props to machine as `config`. Example:

```
const machineConfig = {
        context: {},
        mutations: {},
        actions: {},
        guards: {}
}

const TrafficLight = () => (
  <machine initial="green" config={machineConfig}>
    <state id="green">
      <transition event="TIMER" target="yellow" />
    </state>
  </machine>
);

```
or alternatively:

```
const TrafficLight = () => (
  <machine initial="green">
    {{
        context: {},
        mutations: {},
        actions: {},
        guards: {}
    }}
    <state id="green">
      <transition event="TIMER" target="yellow" />
    </state>
  </machine>
);
```

Differences from xstate (besides syntax)
----------------------------------------

- There is a field called "mutations" that wraps an object or function in an xstate assign operator. This helps me mentally separate "fire and forget" xstate actions from actions that actually mutate the context.


TODOS:
------

- ESlint config
- Mutations should support object syntax
- Figure out what, if anything, can be done to leverage TSX
- Who knows, maybe even tests :-P
