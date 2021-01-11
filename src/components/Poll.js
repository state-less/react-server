const { Component } = require('../server/component');
const {ClientComponent, Action} = require('../state-less');
const {publicStore} = require('../stores');
const logger = require('../lib/logger');

const Poll = Component(async (props, socket) => {
    const {values, temp, key} = props;
    const [votes, setVotes] = await Component.useState(values.map(v => 0),'votes', {atomic:'value=ans+x'});
    logger.warning`Used state ${votes}`
    // logger.info`State used. ${votes}`;
    // const [voted, setVoted, onRequest] = Component.useState({}, 'voted');
    // const [authenticated, setAuthenticated] = Component.useClientState(false, "auth", {scope: socket.id});
    // const [secret] = Component.useState('Yo mama', 'secret',  {deny: authenticated == false});
    // const [hasVoted, setHasVoted] = Component.useClientState(false,"hasVoted", {scope: socket.id});
    
    // const [protected] = Component.useState(null, 'protected', {deny: !authenticated});

    // Component.useEffect(() => {

    //     logger.error`TEmp ${temp} effect`
        
    //     const to = Component.setTimeout(async () => {
    //       const _votes = [...votes];
    //       const ind = ~~(Math.random()*values.length)
    //      logger.debug`About to set dynamodb state in component ${votes} -> ${ind}+1`
    //      _votes[ind] = (_votes[ind] + 1) || 3 ;
    //       logger.error`TEmp ${temp} setVotes ${votes} ${_votes}`
    //       await setVotes(_votes);
    //     }, 2000);
    //     return () => {
    //       clearTimeout(to);
    //     }
    // });

    // Component.useClientEffect(() => {
    //   logger.scope('effect').error`Client Connected`
    //   return () => {
    //     logger.scope('effect').error`Client Disconnected ${util.inspect(socket)}`
        
    //   }
    // });

    const authenticate = ({socket}, password) => {
      if (password === 'foobar') {
        setAuthenticated(true)
      } else {
        throw new Error('Wrong password.');
      }
    }

    const logout = () => {
      setAuthenticated(false);
    }

    const vote = async ({socket}, option) => {
      if (!values[option]) {
        throw new Error(`Unsupported value. Supported values are ${values}`);
      }
  
      logger.warning`VOTING ${socket.id}`;
      // if (socket.id in voted) {
      //   throw new Error('Cannot vote twice');
      // }
      
      logger.scope('foo').error`vote ${socket}`

      let _votes = [...votes];
      _votes[option]++;
      // voted[socket.id] = true;
      // setVoted(voted);
      await setVotes(_votes);
      // setHasVoted(option)

      return {success: true}
    };
  
    return <ClientComponent 
      values={values} 
      //authenticated={authenticated} voted={hasVoted} 
      votes={votes}>
      <Action onClick={vote}>vote</Action>
      {/* <Action onClick={authenticate}>authenticate</Action>
      <Action onBeforeUnload={logout} /> */}
    </ClientComponent>

}, publicStore);


module.exports = {Poll};