import {getEventsByFilter} from '../utils/filter.js';
import {FilterType} from '../const.js';

export default class Events {
  constructor() {
    this._events = [];
    this._activeFilterType = FilterType.EVERYTHING;

    this._dataChangeHandlers = [];
    this._filterChangeHandlers = [];
  }

  _callHandlers(handlers) {
    handlers.forEach((handler) => handler());
  }

  addEvent(event) {
    this._events = [].concat(event, this._events);
    this._callHandlers(this._dataChangeHandlers);
  }

  getEvents() {
    return getEventsByFilter(this._events, this._activeFilterType);
  }

  getEventsAll() {
    return this._events;
  }

  removeEvent(id) {
    const index = this._events.findIndex((it) => it.id === id);

    if (index === -1) {
      return false;
    }

    this._events = [].concat(this._events.slice(0, index), this._events.slice(index + 1));

    this._callHandlers(this._dataChangeHandlers);

    return true;
  }

  setDataChangeHandler(handler) {
    this._dataChangeHandlers.push(handler);
  }

  setEvents(events) {
    this._events = Array.from(events);
    this._callHandlers(this._dataChangeHandlers);
  }

  setFilter(filterType) {
    this._activeFilterType = filterType;
    this._callHandlers(this._filterChangeHandlers);
  }

  setFilterChangeHandler(handler) {
    this._filterChangeHandlers.push(handler);
  }

  updateEvent(id, event) {
    const index = this._events.findIndex((it) => it.id === id);

    if (index === -1) {
      return false;
    }

    this._events = [].concat(this._events.slice(0, index), event, this._events.slice(index + 1));
    this._callHandlers(this._dataChangeHandlers);

    return true;
  }
}
