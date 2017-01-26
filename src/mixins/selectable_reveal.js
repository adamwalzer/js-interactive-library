export default function (props, opts = {}) {
    return (
        <$k.Component className="selectable-reveal">
            <$k.MediaCollection
                play={_.get(props, 'data.reveal.open')}
                {...opts.MediaCollectionProps}
            />
            <$k.Selectable
                dataTarget="selectable"
                {...opts.SelectableProps}
            />
            <$k.Reveal
                openTarget="reveal"
                openReveal={_.get(props, 'data.selectable.target.props.message')}
                {...opts.RevealProps}
            />
        </$k.Component>
    );
}
