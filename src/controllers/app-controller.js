import Api from '../api/api';
import Store from '../api/store';
import Provider from '../api/provider';
import TripController from './trip-controller';
import FilterController from './filter-controller';
import StatisticsController from './statistics-controller';
import EventsModel from '../models/events-model';
import EventModel from '../models/event-model';
import LoadEventsComponent from '../components/load-events';
import MenuComponent from '../components/menu';
import {renderComponent, removeComponent, RenderPosition} from '../utils/render';
import {MenuItem, AUTHORIZATION, END_POINT, STORE_NAME} from '../const';

const tripControlsElement = document.querySelector(`.trip-main__trip-controls`);
const tripEventsElement = document.querySelector(`.trip-events`);
const pageMainElement = document.querySelector(`.page-main`);
const bodyContainerElement = pageMainElement.querySelector(`.page-body__container`);
const eventAddButtonElement = document.querySelector(`.trip-main__event-add-btn`);

const menuItems = Object.values(MenuItem)
  .map((item) => {
    return {
      name: item,
      active: item === MenuItem.TABLE
    };
  });

export default class AppController {
  constructor() {
    this._api = new Api(END_POINT, AUTHORIZATION);
    this._store = new Store(STORE_NAME, window.localStorage);
    this._apiWithProvider = new Provider(this._api, this._store);

    this._eventsModel = new EventsModel();

    this._filterController = new FilterController(
        tripControlsElement,
        this._eventsModel
    );
    this._tripController = new TripController(
        tripEventsElement,
        this._eventsModel,
        this._apiWithProvider
    );
    this._statisticsController = new StatisticsController(
        bodyContainerElement,
        this._eventsModel
    );

    this._menuComponent = new MenuComponent(menuItems);
    this._loadEventsComponent = new LoadEventsComponent();
  }

  init() {
    renderComponent(tripControlsElement, this._menuComponent, RenderPosition.AFTERBEGIN);
    this._filterController.render();
    renderComponent(tripEventsElement, this._loadEventsComponent);

    Promise.all([
      this._apiWithProvider.getDestinations(),
      this._apiWithProvider.getOffers(),
      this._apiWithProvider.getEvents()
    ])
      .then((response) => {
        const [destinations, offers, events] = response;

        this._tripController.setDestinations(destinations);
        this._tripController.setOffers(offers);
        this._eventsModel.setEvents(events);
        this._tripController.render();
        removeComponent(this._loadEventsComponent);
        this._statisticsController.render();
        this._statisticsController.hide();
      });


    eventAddButtonElement.addEventListener(`click`, () => {
      this._tripController.createEvent();
    });

    this._menuComponent.setItemClickHandler((menuItem) => {
      switch (menuItem) {
        case MenuItem.STATS:
          this._menuComponent.setActiveItem(MenuItem.STATS);
          this._filterController.hide();
          this._tripController.hide();
          this._statisticsController.show();
          break;
        case MenuItem.TABLE:
          this._menuComponent.setActiveItem(MenuItem.TABLE);
          this._filterController.show();
          this._statisticsController.hide();
          this._tripController.show();
          break;
      }
    });

    window.addEventListener(`online`, () => {
      document.title = document.title.replace(` [offline]`, ``);

      if (!this._apiWithProvider.getSynchronize()) {
        this._apiWithProvider.sync()
          .then((events) => {
            this._eventsModel.setEvents(EventModel.parseEvents(events));
            this._tripController.updateEvents();
          })
          .catch((err) => {
            throw new Error(err);
          });
      }
    });

    window.addEventListener(`offline`, () => {
      document.title += ` [offline]`;
    });
  }
}
