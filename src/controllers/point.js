import {Position, render, unrender, Mode, DateFormat, Key, TRANSPORT_TYPES, PLACE_TYPES} from '../utils.js';
import Card from '../components/card.js';
import EditCard from '../components/edit-card.js';
import moment from 'moment';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import 'flatpickr/dist/themes/light.css';

const DELAY = 1;
const ANIMATION_TIMEOUT = 600;
class PointController {
  constructor(container, data, mode, onDataChange, onChangeView, destinations, additionalOptions) {
    this._container = container;
    this._data = data;
    this._onChangeView = onChangeView;
    this._onDataChange = onDataChange;
    this._pointView = new Card(data);
    this._pointEdit = new EditCard(data, destinations, TRANSPORT_TYPES, PLACE_TYPES, additionalOptions);
    this.init(mode);
  }

  init(mode) {
    let renderPosition = Position.BEFOREEND;
    let currentView = this._pointView;

    if (mode === Mode.ADDING) {
      renderPosition = Position.AFTERBEGIN;
      currentView = this._pointEdit;
      this._pointEdit.getElement().querySelector(`.event__reset-btn`).textContent = `Cancel`;
      this._pointEdit.getElement().querySelector(`.event__favorite-btn`).classList.add(`visually-hidden`);
    }

    const onEscKeyDown = (evt) => {
      if (evt.key === Key.ESCAPE_IE || evt.key === Key.ESCAPE) {
        if (this._pointEdit.getElement().parentNode === this._container.getElement()) {
          this._container.getElement().replaceChild(this._pointView.getElement(), this._pointEdit.getElement());
          this._pointEdit.resetForm();
        }
        document.removeEventListener(`keydown`, onEscKeyDown);
      }
    };

    flatpickr(this._pointEdit.getElement().querySelector(`#event-start-time-1`), {
      allowInput: false,
      defaultDate: moment(this._data.dateStart).format(DateFormat.DATE_TIME),
      dateFormat: DateFormat.DATE_TIME_FLATPICKR,
      enableTime: true,
      [`time_24hr`]: true
    });

    flatpickr(this._pointEdit.getElement().querySelector(`#event-end-time-1`), {
      allowInput: false,
      defaultDate: moment(this._data.dateFinish).format(DateFormat.DATE_TIME),
      dateFormat: DateFormat.DATE_TIME_FLATPICKR,
      enableTime: true,
      [`time_24hr`]: true
    });

    this._pointView.getElement()
      .querySelector(`.event__rollup-btn`)
      .addEventListener(`click`, () => {
        this._onChangeView();

        this._container.getElement().replaceChild(this._pointEdit.getElement(), this._pointView.getElement());
        document.addEventListener(`keydown`, onEscKeyDown);
      });

    this._pointEdit.getElement()
      .querySelector(`.event__rollup-btn`)
      .addEventListener(`click`, () => {

        if (mode === Mode.ADDING) {
          unrender(this._pointEdit.getElement());
          this._pointEdit.removeElement();
          this._onDataChange(null, null);
        } else if (mode === Mode.DEFAULT) {
          this._pointEdit.resetForm();
          this._container.getElement().replaceChild(this._pointView.getElement(), this._pointEdit.getElement());
          document.removeEventListener(`keydown`, onEscKeyDown);
        }
      });

    this._pointEdit.getElement()
      .querySelector(`.event__save-btn`)
      .addEventListener(`click`, (evt) => {
        evt.preventDefault();

        const entry = this._getNewData();

        this.block(`save`, true, mode);
        setTimeout(this._onDataChange.bind(this,
            mode === Mode.DEFAULT ? `update` : `create`,
            entry,
            () => {
              this.onErrorDataChange();
            }),
        DELAY);

        document.removeEventListener(`keydown`, onEscKeyDown);
      });

    this._pointEdit.getElement().querySelector(`.event__reset-btn`)
      .addEventListener(`click`, (evt) => {
        evt.preventDefault();

        this.block(`delete`, true, mode);

        if (mode === Mode.ADDING) {
          unrender(this._pointEdit.getElement());
          this._pointEdit.removeElement();
          this._onDataChange(null, null);
        } else if (mode === Mode.DEFAULT) {
          setTimeout(this._onDataChange.bind(this, `delete`, this._data), DELAY);
        }
      });

    render(this._container.getElement(), currentView.getElement(), renderPosition);
  }

  _getNewData() {
    const formData = new FormData(this._pointEdit.getElement().querySelector(`.event--edit`));
    const addOptions = Array.from(this._pointEdit.getElement()
        .querySelectorAll(`.event__offer-selector`)).map((addOption) => {
      return ({
        title: addOption.querySelector(`.event__offer-title`).textContent,
        price: Number(addOption.querySelector(`.event__offer-price`).textContent),
        accepted: addOption.querySelector(`.event__offer-checkbox`).checked
      });
    });
    const destinationDescription = this._pointEdit.getElement().querySelector(`.event__destination-description`).textContent;
    const destinationPictures = Array.from(this._pointEdit.getElement().querySelectorAll(`.event__photo`)).map((picture) => ({
      src: picture.src,
      description: picture.alt
    }));

    const entry = {
      id: this._data.id,
      type: formData.get(`event-type`),
      destination: {
        name: formData.get(`event-destination`),
        description: destinationDescription,
        pictures: destinationPictures
      },
      dateStart: moment(formData.get(`event-start-time`), DateFormat.DATE_TIME).valueOf(),
      dateFinish: moment(formData.get(`event-end-time`), DateFormat.DATE_TIME).valueOf(),
      basePrice: Number(formData.get(`event-price`)),
      additionalOptions: addOptions,
      isFavourite: Boolean(formData.get(`event-favorite`)),
      toRAW() {
        return {
          'id': this.id,
          'type': this.type,
          'destination': this.destination,
          'base_price': this.basePrice,
          'date_from': this.dateStart,
          'date_to': this.dateFinish,
          'offers': this.additionalOptions,
          'is_favorite': this.isFavourite
        };
      }
    };
    return entry;
  }

  shake() {
    this._pointEdit.getElement().style.animation = `shake ${ANIMATION_TIMEOUT / 1000}s`;

    setTimeout(() => {
      this._pointEdit.getElement().style.animation = ``;
    }, ANIMATION_TIMEOUT);
  }

  block(buttonValue, isDisabled, mode) {
    const saveButton = this._pointEdit.getElement().querySelector(`.event__save-btn`);
    const deleteButton = this._pointEdit.getElement().querySelector(`.event__reset-btn`);

    const setDisabledValue = (element, selector) => {
      element.querySelectorAll(selector).forEach((input) => {
        input.disabled = isDisabled;
      });
    };

    this._pointEdit.getElement().querySelector(`.event--edit`).style.border = ``;

    this._pointEdit.getElement().querySelector(`.event__type-toggle`).disabled = isDisabled;
    this._pointEdit.getElement().querySelector(`.event__favorite-checkbox`).disabled = isDisabled;
    this._pointEdit.getElement().querySelector(`.event__rollup-btn`).disabled = isDisabled;
    setDisabledValue(this._pointEdit.getElement(), `.event__input`);
    setDisabledValue(this._pointEdit.getElement(), `.event__offer-checkbox`);
    saveButton.disabled = isDisabled;
    deleteButton.disabled = isDisabled;

    if (isDisabled) {
      if (buttonValue === `save`) {
        saveButton.textContent = `Saving...`;
      } else {
        deleteButton.textContent = `Deleting...`;
      }
    } else {
      saveButton.textContent = `Save`;
      if (mode === Mode.ADDING) {
        deleteButton.textContent = `Cancel`;
      } else if (mode === Mode.DEFAULT) {
        deleteButton.textContent = `Delete`;
      }
    }
  }

  onErrorDataChange() {
    this.shake();
    this.block(null, false);
    this._pointEdit.getElement().querySelector(`.event--edit`).style.border = `3px solid red`;
    document.addEventListener(`keydown`, this._onEscKeyDown);
  }

  setDefaultView() {
    if (this._container.getElement().contains(this._pointEdit.getElement())) {
      this._container.getElement().replaceChild(this._pointView.getElement(),
          this._pointEdit.getElement());
      this._pointEdit.resetForm();
    }
  }
}

export default PointController;
