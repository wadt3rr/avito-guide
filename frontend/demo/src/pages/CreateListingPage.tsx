import { useState } from 'react';
import { anchor } from '../onboarding-anchors';
import { useOnboardingContext } from '../onboarding-context';

const BREADCRUMB = ['Личные вещи', 'Одежда, обувь, аксессуары', 'Женская одежда', 'Джинсы'];

const CONDITIONS = [
  { id: 'new-tag', title: 'Новое с биркой', hint: 'Неношеная вещь. Есть бирка и ярлыки с информацией о модели.' },
  { id: 'excellent', title: 'Отличное', hint: 'Нет следов носки, а также потёртостей, пятен и других дефектов.' },
  { id: 'good', title: 'Хорошее', hint: 'Есть небольшие дефекты.' },
  { id: 'fair', title: 'Удовлетворительное', hint: 'Есть заметные дефекты.' },
];

const CUTS = ['Прямые', 'Широкие', 'Узкие', 'Джинсы мом', 'Клёш', 'Карго'];
const CONTACT_WAYS = ['Звонки и сообщения', 'Только звонки', 'Только сообщения'];
const PHOTO_SLOTS = [0, 1, 2, 3];

export function CreateListingPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState('');
  const [cut, setCut] = useState('');
  const [contactWay, setContactWay] = useState(CONTACT_WAYS[0]);

  useOnboardingContext({ flow: 'create_listing' });

  return (
    <div className="container additem">
      <button className="additem__back" aria-label="Назад">
        ←
      </button>

      <h1 className="additem__title">Новое объявление</h1>
      <div className="additem__crumbs" {...anchor('form-breadcrumb')}>
        {BREADCRUMB.map((crumb) => (
          <span key={crumb} className="additem__crumb">
            {crumb}
          </span>
        ))}
      </div>

      <form className="additem__form" onSubmit={(event) => event.preventDefault()}>
        <div className="fld">
          <label className="fld__label" htmlFor="title">
            Название объявления
          </label>
          <input
            id="title"
            className="fld__input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            {...anchor('form-title')}
          />
          <div className="fld__hint">
            Например, «Комбинезон зимний Reima 104 см» или «Apple Watch 3 стальной ремешок»
          </div>
        </div>

        <div className="fld">
          <label className="fld__label" htmlFor="kind">
            Вид объявления
          </label>
          <select id="kind" className="fld__input" {...anchor('form-kind')}>
            <option value="">Выберите</option>
            <option>Товар приобретён на продажу</option>
            <option>Вещь бывшая в употреблении</option>
          </select>
        </div>

        <div className="fld" {...anchor('form-condition')}>
          <span className="fld__label">Состояние</span>
          <div className="radios">
            {CONDITIONS.map((item) => (
              <label key={item.id} className="radio">
                <input
                  type="radio"
                  name="condition"
                  checked={condition === item.id}
                  onChange={() => setCondition(item.id)}
                />
                <span>
                  <span className="radio__title">{item.title}</span>
                  <span className="radio__hint">{item.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <h2 className="additem__section">Внешний вид</h2>

        <div className="fld">
          <span className="fld__label">Фотографии</span>
          <div className="fld__hint fld__hint--above">Не более 10</div>
          <div className="photos" {...anchor('form-photos')}>
            <button type="button" className="photo-slot photo-slot--main">
              +<span className="photo-slot__label">Добавить фото</span>
            </button>
            {PHOTO_SLOTS.map((slot) => (
              <button key={slot} type="button" className="photo-slot">
                +
              </button>
            ))}
          </div>
        </div>

        <h2 className="additem__section">Характеристики</h2>
        <p className="additem__lead">Укажите их, чтобы покупателям было проще найти объявление.</p>

        <div {...anchor('form-features')}>
          <div className="fld">
            <label className="fld__label" htmlFor="size">
              Размер
            </label>
            <select id="size" className="fld__input">
              <option value="">Выберите</option>
              <option>42 (XS)</option>
              <option>44 (S)</option>
              <option>46 (M)</option>
            </select>
            <a className="fld__link">Таблица размеров</a>
          </div>

          <div className="fld">
            <label className="fld__label" htmlFor="brand">
              Бренд
            </label>
            <input id="brand" className="fld__input" />
            <div className="fld__hint">
              Выберите «Без бренда», если марка не указана. Или «Другой», если бренда нет в списке.
            </div>
          </div>

          <div className="fld">
            <span className="fld__label">Фасон</span>
            <div className="radios">
              {CUTS.map((item) => (
                <label key={item} className="radio radio--compact">
                  <input
                    type="radio"
                    name="cut"
                    checked={cut === item}
                    onChange={() => setCut(item)}
                  />
                  <span className="radio__title">{item}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <h2 className="additem__section">Подробности</h2>

        <div className="fld">
          <label className="fld__label" htmlFor="description">
            Описание объявления
          </label>
          <textarea
            id="description"
            className="fld__input fld__input--area"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            {...anchor('form-description')}
          />
          <div className="fld__hint">
            Не указывайте в описании телефон и e-mail — для этого есть отдельные поля
          </div>
        </div>

        <div className="fld">
          <label className="fld__label" htmlFor="price">
            Цена
          </label>
          <input
            id="price"
            className="fld__input"
            placeholder="₽"
            inputMode="numeric"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            {...anchor('form-price')}
          />
        </div>

        <h2 className="additem__section">Местоположение</h2>

        <div className="fld" {...anchor('form-location')}>
          <input className="fld__input" placeholder="Начните вводить адрес" />
          <div className="fld__hint">
            Укажите реальный адрес, где покупатель может купить или получить товар
          </div>
          <div className="map">
            <span className="map__pin">◉</span>
            <span className="map__label">Москва</span>
          </div>
        </div>

        <h2 className="additem__section">Контакты</h2>

        <div className="fld" {...anchor('form-contacts')}>
          <span className="fld__label">Телефон</span>
          <div className="fld__hint fld__hint--above">
            Чтобы ваш настоящий номер не попал в базы мошенников, мы показываем вместо него
            подменный, а звонки переводим вам. Эту защиту нельзя отключить.
          </div>
          <input className="fld__input" defaultValue="8 912 755-78-55" />
        </div>

        <div className="fld">
          <span className="fld__label">Способ связи</span>
          <div className="radios">
            {CONTACT_WAYS.map((item) => (
              <label key={item} className="radio radio--compact">
                <input
                  type="radio"
                  name="contact"
                  checked={contactWay === item}
                  onChange={() => setContactWay(item)}
                />
                <span className="radio__title">{item}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="additem__actions">
          <button type="submit" className="btn btn--primary" {...anchor('form-submit')}>
            Продолжить
          </button>
          <button type="button" className="btn btn--plain">
            Выйти
          </button>
        </div>

        <p className="additem__legal">
          Вы публикуете объявление и данные в нём, чтобы их мог посмотреть кто угодно в интернете.
        </p>
      </form>
    </div>
  );
}
