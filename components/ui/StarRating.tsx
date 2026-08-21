/**
 * 별점 5개 컴포넌트 — 감상평 작성/수정 시 입력용, 목록 카드 표시용 둘 다 이걸로 씀.
 * onChange를 안 넘기면 읽기 전용(표시만)으로 동작함.
 */

type StarRatingProps = {
  value: number;
  onChange?: (rating: number) => void;
};

export default function StarRating({ value, onChange }: StarRatingProps) {
  const readOnly = !onChange;
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="starRating" role={readOnly ? undefined : "radiogroup"} aria-label="별점">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          className={`star${star <= value ? " starFilled" : ""}`}
          onClick={onChange ? () => onChange(star) : undefined}
          disabled={readOnly}
          aria-label={`${star}점`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
