const FOOTER_LINKS = [
  'Помощь',
  'Безопасность',
  'Реклама на сайте',
  'О компании',
  'Карьера',
  'Авито Журнал',
  'Блог',
  '#яПомогаю',
  'Приложение',
  'Регионы',
  'Ещё',
];

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <nav className="footer__links">
          {FOOTER_LINKS.map((link) => (
            <span key={link} className="footer__link">
              {link}
            </span>
          ))}
        </nav>
        <p className="footer__legal">
          Демонстрационная копия интерфейса, собранная для проверки платформы онбординга.
          С настоящим сервисом не связана, объявления вымышленные.
        </p>
      </div>
    </footer>
  );
}
