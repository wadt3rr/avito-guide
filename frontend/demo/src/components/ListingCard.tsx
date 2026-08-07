import type { Listing } from '../data/mock';

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <article className="listing">
      <div className="listing__photo">
        <span className="listing__emoji">{listing.photo}</span>
        {listing.hasDelivery && <span className="listing__truck">🚚</span>}
        <button className="listing__fav" aria-label="В избранное">
          ♡
        </button>
        <span className="listing__count">{listing.photoCount} фото</span>
      </div>

      <div className="listing__price">{listing.price}</div>
      <h3 className="listing__title">{listing.title}</h3>

      {listing.sellerRating !== undefined && (
        <div className="listing__rating">
          <span className="listing__stars">★</span>
          {listing.sellerRating.toFixed(1)}
        </div>
      )}

      <div className="listing__city">{listing.city}</div>
      <div className="listing__date">{listing.publishedAgo}</div>
    </article>
  );
}
