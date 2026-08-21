"use client";

// 공연 상세 화면 "감상평" 탭 내용 (REV01). PerformanceTabs.tsx 에서 렌더링됨.
// 마이페이지(app/mypage/page.tsx)의 리스트+본인만 액션 패턴을 그대로 따름:
// 목록은 useState+useEffect로 불러오고, 삭제는 confirm() 후 실행, 실패는 alert()로 보여줌.
//
// 감상평은 "회차" 단위 — 같은 공연도 회차를 여러 번 예매해서 봤으면 회차별로 따로 쓸 수 있음.
// 그래서 작성 폼에는 "예매했지만 아직 감상평 안 쓴 회차" 중에서 고르는 드롭다운이 있음.

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import type { Review, ReviewableRound } from "@/lib/data/types";
import { getReviews, getReviewableRounds, writeReview, updateReview, deleteReview } from "@/lib/api/reviews";
import { formatRoundTime } from "@/lib/utils/datetime";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Textarea from "@/components/ui/Textarea";
import StatusMessage from "@/components/ui/StatusMessage";
import StarRating from "@/components/ui/StarRating";

type Props = { performanceId: number };

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

// 작성/수정 공용 폼. rounds가 있으면(작성 모드) 회차 선택 드롭다운을 보여주고,
// 없으면(수정 모드) 회차는 이미 고정이라 안 보여줌.
function ReviewForm({
  rounds,
  initialContent = "",
  initialRating = 5,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  rounds?: ReviewableRound[];
  initialContent?: string;
  initialRating?: number;
  submitLabel: string;
  onSubmit: (content: string, rating: number, roundId?: number) => Promise<void>;
  onCancel?: () => void;
}) {
  const [roundId, setRoundId] = useState<number | "">(rounds?.[0]?.roundId ?? "");
  const [content, setContent] = useState(initialContent);
  const [rating, setRating] = useState(initialRating);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rounds && roundId === "") {
      alert("회차를 선택하세요.");
      return;
    }
    if (!content.trim()) {
      alert("감상평 내용을 입력하세요.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(content, rating, rounds ? Number(roundId) : undefined);
    } catch (e) {
      alert(e instanceof Error ? e.message : "처리에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="reviewForm">
      {rounds && (
        <FormField label="회차">
          <select
            className="fieldInput"
            value={roundId}
            onChange={(e) => setRoundId(Number(e.target.value))}
          >
            {rounds.map((r) => (
              <option key={r.roundId} value={r.roundId}>
                {formatRoundTime(r.roundTime)}
              </option>
            ))}
          </select>
        </FormField>
      )}

      <FormField label="별점">
        <StarRating value={rating} onChange={setRating} />
      </FormField>

      <FormField label="감상평">
        <Textarea
          placeholder="공연은 어떠셨나요?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </FormField>

      <p className="reviewFormRow">스포일러 포함 여부는 AI가 자동으로 판별해요.</p>

      <div className="reviewFormActions">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={submitting}>
            취소
          </Button>
        )}
        <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "처리 중..." : submitLabel}
        </Button>
      </div>
    </div>
  );
}

function ReviewCard({
  review,
  isMine,
  onUpdate,
  onDelete,
}: {
  review: Review;
  isMine: boolean;
  onUpdate: (content: string, rating: number) => Promise<void>;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const isSpoiler = review.containsSpoiler === "Y";

  if (editing) {
    return (
      <ReviewForm
        initialContent={review.content}
        initialRating={review.rating}
        submitLabel="수정 완료"
        onCancel={() => setEditing(false)}
        onSubmit={async (content, rating) => {
          await onUpdate(content, rating);
          setEditing(false);
        }}
      />
    );
  }

  return (
    <div className="reviewCard">
      <div className="reviewCardHeader">
        <div>
          <p className="reviewAuthor">{review.userNm}</p>
          <StarRating value={review.rating} />
          <p className="reviewDate">
            {formatRoundTime(review.roundTime)} 관람 · {formatDate(review.insDe)} 작성
          </p>
        </div>

        {isMine && (
          <div className="reviewActions">
            <Button variant="ghost" onClick={() => setEditing(true)}>
              수정
            </Button>
            <Button variant="danger" onClick={onDelete}>
              삭제
            </Button>
          </div>
        )}
      </div>

      {isSpoiler && !revealed ? (
        <button type="button" className="reviewSpoilerBtn" onClick={() => setRevealed(true)}>
          스포일러 포함 — 클릭해서 보기
        </button>
      ) : (
        <p className="reviewContent">{review.content}</p>
      )}
    </div>
  );
}

export default function ReviewSection({ performanceId }: Props) {
  const { userSession } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reservedRounds, setReservedRounds] = useState<ReviewableRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [writing, setWriting] = useState(false);

  useEffect(() => {
    getReviews(performanceId)
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [performanceId]);

  useEffect(() => {
    if (!userSession) return;
    getReviewableRounds(performanceId)
      .then(setReservedRounds)
      .catch(() => setReservedRounds([]));
  }, [performanceId, userSession]);

  // 내가 이미 감상평을 쓴 회차들 — 예매 회차 목록에서 이걸 빼면 "아직 안 쓴 회차"만 남음
  const myReviewedRoundIds = reviews
    .filter((r) => r.userId === userSession?.userId)
    .map((r) => r.roundId);
  const availableRounds = reservedRounds.filter((r) => !myReviewedRoundIds.includes(r.roundId));

  const handleWrite = async (content: string, rating: number, roundId?: number) => {
    if (!roundId) return;
    const created = await writeReview(performanceId, roundId, content, rating);
    setReviews((prev) => [created, ...prev]);
    setWriting(false);
  };

  const handleUpdate = async (reviewId: number, content: string, rating: number) => {
    const updated = await updateReview(reviewId, content, rating);
    setReviews((prev) => prev.map((r) => (r.reviewId === reviewId ? updated : r)));
  };

  const handleDelete = async (reviewId: number) => {
    if (!confirm("감상평을 삭제하시겠습니까?")) return;
    try {
      await deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => r.reviewId !== reviewId));
    } catch (e) {
      alert(e instanceof Error ? e.message : "삭제에 실패했습니다.");
    }
  };

  return (
    <div>
      {userSession &&
        availableRounds.length > 0 &&
        (writing ? (
          <ReviewForm
            rounds={availableRounds}
            submitLabel="등록"
            onCancel={() => setWriting(false)}
            onSubmit={handleWrite}
          />
        ) : (
          <Button
            variant="secondary"
            onClick={() => setWriting(true)}
            style={{ marginBottom: "var(--space-4)" }}
          >
            감상평 작성하기
          </Button>
        ))}

      {loading && <StatusMessage variant="loading">불러오는 중...</StatusMessage>}

      {!loading && reviews.length === 0 && <p className="detailEmpty">아직 작성된 감상평이 없습니다.</p>}

      <div className="reviewList">
        {reviews.map((review) => (
          <ReviewCard
            key={review.reviewId}
            review={review}
            isMine={review.userId === userSession?.userId}
            onUpdate={(content, rating) => handleUpdate(review.reviewId, content, rating)}
            onDelete={() => handleDelete(review.reviewId)}
          />
        ))}
      </div>
    </div>
  );
}
