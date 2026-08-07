import { useEffect } from 'react'
import { Button } from '../Button/Button'
import { Icon } from '../Icon/Icon'
import './StepEditorDrawer.scss'

type StepEditorDrawerProps = {
  isOpen: boolean
  onClose: () => void
}

const targets = [
  { label: 'Поле «Название объявления»', code: 'form-title' },
  { label: 'Поле «Цена»', code: 'form-price' },
  { label: 'Загрузка фотографий', code: 'form-photos' },
  { label: 'Кнопка «Продолжить»', code: 'form-submit' },
]

export function StepEditorDrawer({ isOpen, onClose }: StepEditorDrawerProps) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      <button
        aria-label="Закрыть редактор шага"
        className="step-editor-backdrop"
        onClick={onClose}
        type="button"
      />

      <aside
        aria-labelledby="step-editor-title"
        aria-modal="true"
        className="step-editor-drawer"
        role="dialog"
      >
        <header className="step-editor-drawer__header">
          <div>
            <p className="step-editor-drawer__eyebrow">Редактор шага</p>
            <h2 id="step-editor-title">Шаг 1</h2>
          </div>
          <button
            aria-label="Закрыть"
            className="step-editor-drawer__close"
            onClick={onClose}
            type="button"
          >
            <Icon name="close" size={20} />
          </button>
        </header>

        <div className="step-editor-drawer__body">
          <label className="drawer-field">
            <span className="drawer-field__label">Название подсказки</span>
            <input
              className="drawer-field__control"
              defaultValue="Как назвать объявление"
              type="text"
            />
          </label>

          <label className="drawer-field">
            <span className="drawer-field__label">Текст</span>
            <textarea
              className="drawer-field__control drawer-field__control--textarea"
              defaultValue="Укажите конкретное название товара, например iPhone 13"
              rows={4}
            />
          </label>

          <div className="drawer-field">
            <span className="drawer-field__label">Целевой элемент</span>
            <div className="step-editor-drawer__targets">
              {targets.map((target, index) => (
                <button
                  className={`step-editor-drawer__target${index === 0 ? ' step-editor-drawer__target--selected' : ''}`}
                  key={target.code}
                  type="button"
                >
                  <span>{target.label}</span>
                  <code>{target.code}</code>
                </button>
              ))}
            </div>
            <span className="drawer-field__hint">
              Список берётся из каталога якорей тестового сайта.
            </span>
          </div>

          <div className="step-editor-drawer__field-row">
            <label className="drawer-field">
              <span className="drawer-field__label">Когда показывать</span>
              <select className="drawer-field__control" defaultValue="page-open">
                <option value="page-open">При открытии страницы</option>
                <option value="click">После клика</option>
              </select>
            </label>

            <label className="drawer-field">
              <span className="drawer-field__label">Завершение шага</span>
              <select className="drawer-field__control" defaultValue="next">
                <option value="next">Нажатием «Далее»</option>
                <option value="field">Заполнением поля</option>
              </select>
            </label>
          </div>

          <div className="step-editor-drawer__field-row">
            <label className="drawer-field">
              <span className="drawer-field__label">Расположение</span>
              <select className="drawer-field__control" defaultValue="bottom">
                <option value="bottom">Снизу</option>
                <option value="top">Сверху</option>
                <option value="right">Справа</option>
              </select>
            </label>

            <label className="drawer-field">
              <span className="drawer-field__label">Таймаут поиска, сек</span>
              <input className="drawer-field__control" defaultValue="5" type="text" />
            </label>
          </div>
        </div>

        <footer className="step-editor-drawer__footer">
          <Button variant="danger">Удалить шаг</Button>
          <Button onClick={onClose}>Сохранить шаг</Button>
        </footer>
      </aside>
    </>
  )
}
