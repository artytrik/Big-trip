import {Position} from '../utils.js';
import {Card} from '../components/card.js';
import {EditCard} from '../components/edit-card.js';
import {render} from '../utils.js';
import moment from "moment";
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import 'flatpickr/dist/themes/light.css';

export class PointController {
  constructor(container, data, onDataChange, onChangeView) {
    this._container = container;
    this._data = data;
    this._onChangeView = onChangeView;
    this._onDataChange = onDataChange;
    this._pointView = new Card(data);
    this._pointEdit = new EditCard(data);

    this.init();
  }

  init() {
    const onEscKeyDown = (evt) => {
      if (evt.key === `Escape` || evt.key === `Esc`) {
        this._container.getElement().replaceChild(this._pointView.getElement(), this._pointEdit.getElement());
        document.removeEventListener(`keydown`, onEscKeyDown);
      }
    };

    flatpickr(this._pointEdit.getElement().querySelector(`#event-start-time-1`), {
      altInput: true,
      allowInput: true,
      defaultDate: moment(this._data.dateStart).format(`DD/MM/YY HH:mm`),
      dateFormat: `d/m/y H:i`,
      enableTime: true
    });

    flatpickr(this._pointEdit.getElement().querySelector(`#event-end-time-1`), {
      altInput: true,
      allowInput: true,
      defaultDate: moment(this._data.dateFinish).format(`DD/MM/YY HH:mm`),
      dateFormat: `d/m/y H:i`,
      enableTime: true
    });

    this._pointView.getElement()
      .querySelector(`.event__rollup-btn`)
      .addEventListener(`click`, () => {
        this._container.getElement().replaceChild(this._pointEdit.getElement(), this._pointView.getElement());
        document.addEventListener(`keydown`, onEscKeyDown);
      });

    this._pointEdit.getElement()
      .querySelector(`.event__save-btn`)
      .addEventListener(`click`, (evt) => {
        evt.preventDefault();

        const formData = new FormData(this._pointEdit.getElement().querySelector(`.event--edit`));
        const addOptions = Array.from(this._pointEdit.getElement()
            .querySelectorAll(`.event__offer-selector`)).map((addOption) => {
          return ({
            id: addOption.querySelector(`.event__offer-checkbox`).name,
            name: addOption.querySelector(`.event__offer-title`).textContent,
            adPrice: addOption.querySelector(`.event__offer-price`).textContent,
            flag: addOption.querySelector(`.event__offer-checkbox`).checked
          });
        });

        const entry = {
          type: formData.get(`event-type`),
          city: formData.get(`event-destination`),
          dateStart: moment(formData.get(`event-start-time`), `DD/MM/YY HH:mm`).valueOf(),
          dateFinish: moment(formData.get(`event-end-time`), `DD/MM/YY HH:mm`).valueOf(),
          price: formData.get(`event-price`),
          additionalOptions: addOptions
        };

        this._onDataChange(entry, this._data);

        document.removeEventListener(`keydown`, onEscKeyDown);
      });

    render(this._container.getElement(), this._pointView.getElement(), Position.BEFOREEND);
  }

  setDefaultView() {
    if (this._container.getElement().contains(this._pointEdit.getElement())) {
      this._container.getElement().replaceChild(this._pointView.getElement(), this._pointEdit.getElement());
    }
  }
}
