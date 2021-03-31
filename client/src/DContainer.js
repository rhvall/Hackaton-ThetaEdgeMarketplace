import DComponent from './DComponent'
import { drizzleConnect } from '@drizzle/react-plugin'

const mapStateToProps = state => ({
    accounts: state.accounts,
    drizzleStatus: state.drizzleStatus
})

const DContainer = drizzleConnect(
    DComponent,
    mapStateToProps
)

export default DContainer
