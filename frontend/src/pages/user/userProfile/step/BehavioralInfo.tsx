type Props = {
  profile: any
  setProfile: (val: any) => void
}


const BehavioralInfo: React.FC<Props> = ({ profile: _profile, setProfile: _setProfile }) => {
  // 暂时无题目，后续从后端加载
  const questions: string[] = []

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">🧠 Behavioral Questionnaire (Optional)</h2>

      {questions.length === 0 ? (
        <p className="text-gray-400">Comming soon</p>
      ) : (
        <p className="text-gray-400">(Questions and options will be rendered later)</p>
      )}
    </div>
  )
}

export default BehavioralInfo