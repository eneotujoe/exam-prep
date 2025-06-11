import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface QuizScoreProps {
  correctAnswers: number
  totalQuestions: number
}

export default function QuizScore({ correctAnswers, totalQuestions }: QuizScoreProps) {
  const score = (correctAnswers / totalQuestions) * 100
  const roundedScore = Math.round(score)

  const getMessage = () => {
    if (score === 100) return "Excellent! Congratulations!"
    if (score >= 80) return "Great job! You did excellently!"
    if (score >= 60) return "Good effort! You're on the right track."
    if (score >= 40) return "Not bad, but there's room for improvement."
    return "Keep practicing, you'll get better!"
  }

  return (
    <Card className="w-full rounded-none">
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <p className="text-xl font-black">Score</p>
            <p className="text-4xl font-black">{roundedScore}%</p>
            <p className="text-sm text-muted-foreground">
              {correctAnswers} out of {totalQuestions} correct
            </p>
          </div>
          <div className="text-center">
            <p className="text-xl font-black">Remark</p>
            <p className="text-center font-medium">{getMessage()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
